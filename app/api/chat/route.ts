import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export type BookingContext = {
  step?: "salon" | "service" | "datetime" | "name" | "phone" | "confirm";
  salonId?: string;
  salonName?: string;
  salonSlug?: string;
  serviceId?: string;
  serviceName?: string;
  startTime?: string; // ISO
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
};

type Intent =
  | "greeting"
  | "list_salons"
  | "list_services"
  | "booking_help"
  | "start_booking"
  | "cancellation"
  | "opening_hours"
  | "contact"
  | "admin_help"
  | "pricing"
  | "location"
  | "unknown";

const HANDOFFS = [
  { label: "Book a service", href: "/#featured" },
  { label: "View salons", href: "/#featured" },
  { label: "Contact salon", message: "How do I contact a salon?" },
];

function detectIntent(message: string): { intent: Intent; salonSlug?: string } {
  const lower = message.trim().toLowerCase();
  if (!lower) return { intent: "unknown" };

  if (
    /^(hi|hello|hey|hiya|howdy|good (morning|afternoon|evening)|greetings?)\b/i.test(lower) ||
    lower === "hi" ||
    lower === "hello"
  ) {
    return { intent: "greeting" };
  }

  if (
    /admin|dashboard|backend/i.test(lower) ||
    lower.includes("admin help")
  ) {
    return { intent: "admin_help" };
  }

  if (
    /cancel|cancellation|refund|reschedule|change appointment/i.test(lower)
  ) {
    return { intent: "cancellation" };
  }

  if (
    /(?:opening|working|business)\s*hours?|when (?:are you|do you) open|what time|hours/i.test(lower)
  ) {
    return { intent: "opening_hours" };
  }

  if (
    /book\s*(?:for\s*me|it|one)?|i\s*want\s*to\s*book|schedule\s*(?:me|an?\s*appointment)|make\s*(?:me\s*)?an?\s*appointment|reserve/i.test(lower) &&
    !lower.includes("how to book")
  ) {
    return { intent: "start_booking" };
  }

  if (
    /book|booking|appointment|schedule|reserve/i.test(lower) ||
    lower.includes("how to book")
  ) {
    return { intent: "booking_help" };
  }

  if (
    /price|pricing|cost|how much|npr/i.test(lower)
  ) {
    return { intent: "pricing" };
  }

  if (
    /contact|phone|whatsapp|call|reach|how (?:do i |to )?contact/i.test(lower)
  ) {
    return { intent: "contact" };
  }

  if (
    /location|where|address|city|kathmandu|lalitpur/i.test(lower)
  ) {
    return { intent: "location" };
  }

  if (
    /services?\s+(?:in|at|for)\s+(kathmandu|lalitpur)/i.test(lower) ||
    /(?:kathmandu\s*cuts|lalitpur\s*glow)/i.test(lower)
  ) {
    return {
      intent: "list_services",
      salonSlug: /lalitpur/i.test(lower) ? "lalitpur-glow" : "kathmandu-cuts",
    };
  }

  const servicesMatch = lower.match(/services?\s+(?:in|at|for)\s+(.+)/);
  if (servicesMatch) {
    const namePart = servicesMatch[1].replace(/\?/g, "").trim();
    if (namePart.length > 2) {
      return { intent: "list_services", salonSlug: namePart.replace(/\s+/g, "-").toLowerCase() };
    }
  }

  if (
    /salons?|browse|list|show me|find (a )?salon/i.test(lower) ||
    lower.includes("show salons")
  ) {
    return { intent: "list_salons" };
  }

  if (
    /services?|offer|what (do|does)/i.test(lower) ||
    lower.includes("show services")
  ) {
    return {
      intent: "list_services",
      salonSlug: /lalitpur/i.test(lower) ? "lalitpur-glow" : "kathmandu-cuts",
    };
  }

  return { intent: "unknown" };
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Parse relative or ISO date/time from user message */
function parseDateTime(message: string): string | null {
  const lower = message.trim().toLowerCase();
  const now = new Date();

  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  let hour = timeMatch ? parseInt(timeMatch[1], 10) : 14;
  const min = timeMatch && timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const ampm = timeMatch && timeMatch[3] ? timeMatch[3].toLowerCase() : null;
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  if (/tomorrow/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  }
  if (/today/i.test(lower)) {
    const d = new Date(now);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  }
  const isoMatch = message.match(/(\d{4})-(\d{2})-(\d{2})\s*(\d{1,2})?:?(\d{2})?/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const h = isoMatch[4] ? parseInt(isoMatch[4], 10) : 14;
    const min2 = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
    const dt = new Date(y, m, d, h, min2, 0, 0);
    return dt.toISOString();
  }
  return null;
}

async function loadSessionContext(sessionId: string): Promise<BookingContext | null> {
  try {
    const { data } = await supabaseAdmin
      .from("chat_sessions")
      .select("context")
      .eq("session_id", sessionId)
      .single();
    return (data?.context as BookingContext) ?? null;
  } catch {
    return null;
  }
}

async function saveSessionContext(sessionId: string, context: BookingContext): Promise<void> {
  try {
    await supabaseAdmin.from("chat_sessions").upsert(
      { session_id: sessionId, context, updated_at: new Date().toISOString() },
      { onConflict: "session_id" }
    );
  } catch {
    // ignore
  }
}

export async function POST(request: Request) {
  try {
    let body: { message?: string; sessionId?: string; context?: BookingContext };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const message = body.message?.toString()?.trim();
    if (!message) {
      return NextResponse.json({
        reply: "Just type something and I'll be happy to help - salons, booking, or anything else!",
        handoffs: HANDOFFS,
        suggestions: ["Show salons", "Book for me", "How to book?"],
      });
    }

    const sessionId = typeof body.sessionId === "string" && body.sessionId.trim() ? body.sessionId.trim() : null;
    let context: BookingContext = { ...(body.context ?? {}) };
    // Only load session from DB when we might be in booking flow (faster replies for simple intents)
    const intentForLoad = detectIntent(message).intent;
    const needsSession =
      intentForLoad === "start_booking" ||
      (typeof body.context?.step === "string" && body.context.step.length > 0);
    if (sessionId && needsSession) {
      const saved = await loadSessionContext(sessionId);
      if (saved && Object.keys(saved).length > 0) context = { ...saved, ...context };
    }

    const withHandoffs = (suggestions: string[]) => ({
      handoffs: HANDOFFS,
      suggestions,
    });

    const reply = (
      text: string,
      opts?: { suggestions?: string[]; context?: BookingContext; clearContext?: boolean }
    ) => {
      const res: { reply: string; handoffs: typeof HANDOFFS; suggestions?: string[]; context?: BookingContext } = {
        reply: text,
        handoffs: HANDOFFS,
        ...(opts?.suggestions && { suggestions: opts.suggestions }),
      };
      if (opts?.context !== undefined) res.context = opts.clearContext ? undefined : opts.context;
      return NextResponse.json(res);
    };

    // ----- Booking flow (multi-turn) -----
    if (context.step || (detectIntent(message).intent === "start_booking" && !context.step)) {
      const intent = detectIntent(message).intent;

      if (context.step === "confirm" && /yes|confirm|please|do it|book it/i.test(message)) {
        const { salonId, serviceId, startTime, customerName, customerPhone } = context;
        if (salonId && serviceId && startTime && customerName && customerPhone) {
          const origin =
            request.headers.get("x-forwarded-host")
              ? `${request.headers.get("x-forwarded-proto") || "https"}://${request.headers.get("x-forwarded-host")}`
              : (typeof request.url === "string" ? new URL(request.url).origin : "http://localhost:3000");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          let bookRes: Response;
          try {
            bookRes = await fetch(`${origin}/api/bookings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                salon_id: salonId,
                service_id: serviceId,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: context.customerEmail || null,
                start_time: startTime,
              }),
              signal: controller.signal,
            });
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            return reply(
              "The booking service took too long to respond. Please try again or book directly on the salon page.",
              { context, suggestions: ["Try again", "Show salons"] }
            );
          }
          clearTimeout(timeoutId);
          const bookData = await bookRes.json();
          if (bookRes.ok && bookData.id) {
            if (sessionId) await saveSessionContext(sessionId, {});
            return reply(
              `Done! Your appointment is confirmed. You're all set for ${context.serviceName} at ${context.salonName}. We've saved your booking in our system - you can check "My bookings" anytime with your phone number. Have a great day!`,
              { context: {}, clearContext: true, suggestions: ["My bookings", "Show salons"] }
            );
          }
          return reply(
            bookData.error || "Something went wrong creating the booking. Please try again or book on the website.",
            { context, suggestions: ["Try again", "Show salons"] }
          );
        }
      }

      if (context.step === "salon" || (intent === "start_booking" && !context.step)) {
        const { data: salons } = await supabaseAdmin
          .from("salons")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("name");
        const namePart = message.replace(/\?/g, "").trim().toLowerCase();
        const match = (salons ?? []).find(
          (s) =>
            s.slug === namePart ||
            s.name.toLowerCase().includes(namePart) ||
            namePart.includes(s.name.toLowerCase())
        );
        if (match) {
          context = {
            step: "service",
            salonId: match.id,
            salonName: match.name,
            salonSlug: match.slug,
          };
          if (sessionId) await saveSessionContext(sessionId, context);
          const { data: services } = await supabaseAdmin
            .from("services")
            .select("id, name, price")
            .eq("salon_id", match.id)
            .eq("is_active", true)
            .order("name");
          const list = (services ?? []).map((s) => `• ${s.name} - ${formatPrice(s.price)}`).join("\n");
          return reply(
            `Great choice - ${match.name}! Here are their services:\n\n${list}\n\nWhich service would you like? Just say the name.`,
            { context, suggestions: (services ?? []).slice(0, 4).map((s) => s.name) }
          );
        }
        const names = (salons ?? []).slice(0, 10).map((s) => s.name).join(", ");
        return reply(
          `I'd love to help you book! Which salon do you prefer? You can say a name from our list:\n\n${names}\n\nOr say "Show salons" to browse.`,
          { context: { step: "salon" }, suggestions: (salons ?? []).slice(0, 4).map((s) => s.name) }
        );
      }

      if (context.step === "service" && context.salonId) {
        const { data: services } = await supabaseAdmin
          .from("services")
          .select("id, name, price")
          .eq("salon_id", context.salonId)
          .eq("is_active", true);
        const namePart = message.trim().toLowerCase();
        const match = (services ?? []).find(
          (s) => s.name.toLowerCase().includes(namePart) || namePart.includes(s.name.toLowerCase())
        );
        if (match) {
          context = {
            ...context,
            step: "datetime",
            serviceId: match.id,
            serviceName: match.name,
          };
          if (sessionId) await saveSessionContext(sessionId, context);
          return reply(
            `Perfect - ${match.name}. When would you like to come in? You can say e.g. "tomorrow 2pm" or "2025-02-20 14:00".`,
            { context, suggestions: ["Tomorrow 2pm", "Today 5pm"] }
          );
        }
        return reply(
          `Which service at ${context.salonName} would you like? You can say the exact name from the list I sent.`,
          { context, suggestions: (services ?? []).slice(0, 4).map((s) => s.name) }
        );
      }

      if (context.step === "datetime" && context.serviceId) {
        const parsed = parseDateTime(message);
        if (parsed) {
          const dt = new Date(parsed);
          if (dt < new Date()) {
            return reply("That date or time is in the past. Please choose a future date and time.", { context });
          }
          context = { ...context, step: "name", startTime: parsed };
          if (sessionId) await saveSessionContext(sessionId, context);
          return reply(
            `Got it - ${dt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}. What's your name?`,
            { context }
          );
        }
        return reply(
          "I didn't catch the date or time. Try e.g. \"tomorrow 2pm\" or \"2025-02-20 14:00\".",
          { context }
        );
      }

      if (context.step === "name") {
        const name = message.trim().replace(/\s+/g, " ").slice(0, 120);
        if (name.length >= 2) {
          context = { ...context, step: "phone", customerName: name };
          if (sessionId) await saveSessionContext(sessionId, context);
          return reply("Thanks! What's the best phone number to confirm your appointment?", { context });
        }
        return reply("Please tell me your name (at least 2 characters).", { context });
      }

      if (context.step === "phone") {
        const phone = message.replace(/\D/g, "").trim().slice(0, 20);
        if (phone.length >= 8) {
          context = { ...context, step: "confirm", customerPhone: phone };
          if (sessionId) await saveSessionContext(sessionId, context);
          const dt = context.startTime ? new Date(context.startTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";
          return reply(
            `Here’s your booking summary:\n\n• Salon: ${context.salonName}\n• Service: ${context.serviceName}\n• Date & time: ${dt}\n• Name: ${context.customerName}\n• Phone: ${phone}\n\nReply "yes" or "confirm" to book, and I’ll save it for you.`,
            { context, suggestions: ["Yes, confirm", "Cancel"] }
          );
        }
        return reply("Please share a valid phone number (at least 8 digits).", { context });
      }

      if (context.step === "confirm" && /cancel|no|nevermind/i.test(message)) {
        if (sessionId) await saveSessionContext(sessionId, {});
        return reply("No problem - booking cancelled. Say \"Book for me\" anytime to start again, or browse salons on the site.", {
          context: {},
          clearContext: true,
          suggestions: ["Book for me", "Show salons"],
        });
      }
    }

    const { intent, salonSlug } = detectIntent(message);

    if (intent === "greeting") {
      return reply(
        "Hey there! I'm here to help you find salons, check services, or even book an appointment for you. What would you like to do?",
        { suggestions: ["Book for me", "Show salons", "How to book?", "What are the prices?", "Where are you located?"] }
      );
    }

    if (intent === "cancellation") {
      return reply(
        "You can cancel or reschedule free of charge up to 24 hours before your appointment. After booking, get in touch with the salon by phone or WhatsApp - their details are on the salon page.",
        { suggestions: ["View salons", "How to book?", "How do I contact a salon?"] }
      );
    }

    if (intent === "opening_hours") {
      return reply(
        "Most salons are open Sun–Fri 9:00 AM – 8:00 PM, and Saturday 10:00 AM – 6:00 PM. Exact hours can vary, so it's worth checking each salon's page before you book.",
        { suggestions: ["Show salons", "How to book?", "Show prices", "Where are you located?"] }
      );
    }

    if (intent === "contact") {
      return reply(
        "Each salon has a phone number and WhatsApp link on their profile. Open a salon page and use the Call or WhatsApp buttons - you can also message them after booking to confirm or reschedule.",
        { suggestions: ["View salons", "How to book?", "Show salons", "What are the prices?"] }
      );
    }

    if (intent === "admin_help") {
      return reply(
        "For admin access, go to /admin and add ?key=YOUR_ADMIN_KEY to the URL. From there you can manage bookings, view OCR sales, upload bills, and see feedback.",
        { suggestions: ["Show salons", "How to book?"] }
      );
    }

    if (intent === "booking_help") {
      return reply(
        "Booking is easy:\n1. Browse salons on our homepage\n2. Pick a salon and choose a service\n3. Enter your name, phone, and preferred date & time\n4. Confirm - the salon gets your booking. You can also say \"Book for me\" and I'll guide you step by step!",
        { suggestions: ["Book for me", "Show salons", "What are the prices?", "Where are you located?"] }
      );
    }

    if (intent === "pricing") {
      const { data: services } = await supabaseAdmin
        .from("services")
        .select("name, price, salon_id")
        .eq("is_active", true)
        .limit(20);
      const { data: salons } = await supabaseAdmin
        .from("salons")
        .select("id, name, slug")
        .eq("is_active", true);
      const salonMap = (salons ?? []).reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as Record<string, { name: string; slug: string }>);
      const lines = (services ?? []).slice(0, 8).map((s) => {
        const salon = salonMap[s.salon_id];
        return `• ${s.name}: ${formatPrice(s.price)}${salon ? ` (${salon.name})` : ""}`;
      });
      return reply(
        `Here are some sample prices:\n\n${lines.join("\n")}\n\nVisit a salon page to see everything they offer. Need help with something else?`,
        { suggestions: ["Show salons", "Show services in Kathmandu Cuts", "How to book?", "Where are you located?"] }
      );
    }

    if (intent === "location") {
      const { data: salons } = await supabaseAdmin
        .from("salons")
        .select("name, slug, city, address")
        .eq("is_active", true);
      const lines = (salons ?? []).map((s) =>
        `• ${s.name}: ${s.city ?? "-"}${s.address ? `, ${s.address}` : ""}`
      );
      return reply(
        `Our salons and where to find them:\n\n${lines.join("\n")}\n\nClick a salon on our homepage to view details and book. Any other questions?`,
        { suggestions: ["Show salons", "How to book?", "What are the prices?", "How do I contact a salon?"] }
      );
    }

    if (intent === "list_salons") {
      const { data: salons } = await supabaseAdmin
        .from("salons")
        .select("name, slug, city")
        .eq("is_active", true)
        .order("name");
      const lines = (salons ?? []).map((s) => `• **${s.name}** — ${s.city ?? "-"}`).join("\n");
      const firstSalon = (salons ?? [])[0]?.name;
      return reply(
        `Here are our salons:\n\n${lines}\n\nWhich one interests you? I can show you their services, prices, or help you book.`,
        {
          suggestions: firstSalon
            ? [`Services at ${firstSalon}`, "Show prices", "Book for me", "How to book?", "Where are you located?"]
            : ["Show prices", "Book for me", "How to book?", "Where are you located?"],
        }
      );
    }

    if (intent === "list_services") {
      let slug = salonSlug ?? "kathmandu-cuts";
      const { data: allSalons } = await supabaseAdmin
        .from("salons")
        .select("id, name, slug")
        .eq("is_active", true);
      const slugFromName = (allSalons ?? []).find((s) =>
        s.name.toLowerCase().replace(/\s+/g, "-") === slug || s.slug === slug
      );
      if (slugFromName) slug = slugFromName.slug;
      const { data: salon } = await supabaseAdmin
        .from("salons")
        .select("id, name")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (!salon) {
        return reply(
          "I couldn't find that salon. Try \"Show salons\" to see what's available.",
          { suggestions: ["Show salons", "How to book?"] }
        );
      }
      const { data: services } = await supabaseAdmin
        .from("services")
        .select("name, price, duration_min")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name");
      const lines = (services ?? []).map((s) =>
        `• ${s.name} - ${formatPrice(s.price)}, ${s.duration_min} min`
      );
      return reply(
        `Services at ${salon.name}:\n\n${lines.length ? lines.join("\n") : "No services listed yet."}\n\nVisit their page to book, or say "Book for me" and I'll guide you. What else would you like to know?`,
        { suggestions: ["Book for me", "Show salons", "What are the prices?", "Where is this salon located?"] }
      );
    }

    return reply(
      "I can help with:\n• Finding salons - try \"Show salons\"\n• Booking - say \"Book for me\" and I'll guide you\n• How to book, cancellation, hours, contact - just ask!\n\nWhat would you like to do?",
      { suggestions: ["Book for me", "Show salons", "How to book?", "What are the prices?", "Where are you located?"] }
    );
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({
      reply: "Something went wrong on my side. Please try again in a moment, or browse salons on the homepage.",
      handoffs: HANDOFFS,
      suggestions: ["Show salons", "How to book?"],
    });
  }
}
