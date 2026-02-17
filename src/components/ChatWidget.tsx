"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Handoff = {
  label: string;
  href?: string;
  message?: string;
};

export type BookingContext = {
  step?: "salon" | "service" | "datetime" | "name" | "phone" | "confirm";
  salonId?: string;
  salonName?: string;
  salonSlug?: string;
  serviceId?: string;
  serviceName?: string;
  startTime?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
};

const QUICK_SUGGESTIONS = [
  "Book for me",
  "Show salons",
  "How to book?",
  "What are the prices?",
  "Where are you located?",
];

const DEFAULT_HANDOFFS: Handoff[] = [
  { label: "Book a service", href: "/#featured" },
  { label: "View salons", href: "/#featured" },
  { label: "Contact salon", message: "How do I contact a salon?" },
];

const CHAT_FETCH_TIMEOUT_MS = 18000;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("chat_session_id");
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem("chat_session_id", id);
  }
  return id;
}

/** Renders text with **bold** segments as actual bold (removes ** and wraps in <strong>). */
function renderMessageContent(content: string) {
  const parts = content.split(/\*\*(.*?)\*\*/g);
  return parts.map((segment, i) =>
    i % 2 === 1 ? <strong key={i}>{segment}</strong> : segment
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3"
      >
        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-500 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-500 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-stone-500 [animation-delay:300ms]" />
      </motion.div>
    </div>
  );
}

export function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [handoffs, setHandoffs] = useState<Handoff[]>(DEFAULT_HANDOFFS);
  const [bookingContext, setBookingContext] = useState<BookingContext | undefined>(undefined);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [messages, suggestions, handoffs, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setSuggestions([]);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_FETCH_TIMEOUT_MS);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId: getSessionId() || undefined,
          context: bookingContext,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      const replyText = data.reply ?? "I didn't quite get that - try again or pick one of the options below.";
      setMessages((prev) => [...prev, { role: "assistant", content: replyText }]);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setHandoffs(
        Array.isArray(data.handoffs) && data.handoffs.length > 0
          ? data.handoffs
          : DEFAULT_HANDOFFS
      );
      if (data.context !== undefined) {
        setBookingContext(data.context && Object.keys(data.context).length > 0 ? data.context : undefined);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isTimeout
            ? "That took longer than usual. Please try again — or browse salons on the homepage and book from there."
            : "Oops, something went wrong. Give it another try - I'm here to help!",
        },
      ]);
      setSuggestions(QUICK_SUGGESTIONS);
      setHandoffs(DEFAULT_HANDOFFS);
    } finally {
      setLoading(false);
    }
  }

  function handleHandoff(h: Handoff) {
    if (h.href) {
      setOpen(false);
      const hash = h.href.split("#")[1];
      router.push(h.href);
      // Next.js doesn't scroll to hash on client-side nav; scroll once the route is ready
      const id = hash?.trim();
      if (id) {
        const scrollToTarget = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(scrollToTarget, 100);
        setTimeout(scrollToTarget, 500);
      }
    } else if (h.message) {
      sendMessage(h.message);
    } else {
      sendMessage(h.label);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Floating button with pulse */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl shadow-stone-900/25 transition-shadow hover:shadow-2xl hover:shadow-stone-900/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {!open && (
          <span className="absolute inset-0 animate-ping rounded-full bg-stone-900 opacity-20" />
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-24 right-6 z-50 flex w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xl shadow-stone-900/10"
          >
            {/* Header */}
            <div className="border-b border-stone-100 bg-gradient-to-br from-stone-50 to-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-white">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Hi, I'm your assistant</h3>
                  <p className="text-xs text-stone-500">Find salons, book appointments, or ask anything</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={panelRef}
              className="flex max-h-[340px] min-h-[220px] flex-1 flex-col overflow-y-auto p-4"
            >
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center"
                >
                  <p className="text-sm text-stone-600">
                    Hi! How can I help you today?
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => sendMessage(s)}
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-all hover:border-amber-200 hover:bg-amber-50/50 hover:text-stone-900"
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {DEFAULT_HANDOFFS.map((h, i) => (
                      <motion.span key={h.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
                        <button
                          type="button"
                          onClick={() => handleHandoff(h)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800"
                        >
                          {h.label}
                          {(h.href || h.message) && (
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            m.role === "user"
                              ? "rounded-br-md bg-stone-900 text-white"
                              : "rounded-bl-md bg-stone-100 text-stone-800"
                          }`}
                        >
                          <p
                            className={
                              m.role === "assistant"
                                ? "whitespace-pre-wrap font-sans text-[15px] font-normal leading-relaxed tracking-normal text-stone-800 [word-break:break-word] [&_strong]:font-semibold [&_strong]:text-stone-900"
                                : "whitespace-pre-wrap font-sans text-sm font-normal leading-relaxed tracking-normal text-white [word-break:break-word]"
                            }
                          >
                            {m.role === "assistant" ? renderMessageContent(m.content) : m.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {loading && <TypingIndicator />}

                  {(suggestions.length > 0 || handoffs.length > 0) && !loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-3 pt-2"
                    >
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => sendMessage(s)}
                              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-amber-200 hover:bg-amber-50/50 hover:text-stone-900"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      {handoffs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {handoffs.map((h) => (
                            <button
                              key={h.label}
                              type="button"
                              onClick={() => handleHandoff(h)}
                              className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-800"
                            >
                              {h.label}
                              {(h.href || h.message) && (
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-stone-100 p-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message or pick an option above..."
                  disabled={loading}
                  className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={!loading && input.trim() ? { scale: 1.02 } : {}}
                  whileTap={!loading && input.trim() ? { scale: 0.98 } : {}}
                >
                  Send
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
