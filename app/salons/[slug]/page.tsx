"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { getSalonImage } from "@/lib/images";
import { SalonPageSkeleton } from "@/components/ui/Skeleton";
import { EmptyStateServices, EmptyStateReviews } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useToast } from "@/context/ToastContext";

type Salon = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration_min: number;
};

type Review = {
  id: string;
  feedback: string;
  created_at: string;
  rating?: number | null;
  sentiment: string | null;
};

const WORKING_HOURS = [
  { day: "Sun–Fri", time: "9:00 AM – 8:00 PM" },
  { day: "Saturday", time: "10:00 AM – 6:00 PM" },
];

function getRating(slug: string): number {
  const h = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 4.2 + (h % 8) / 10;
}

const StarIcon = ({ filled, className = "h-4 w-4" }: { filled: boolean; className?: string }) => (
  <svg
    className={`${filled ? "text-amber-500" : "text-stone-300"} ${className}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

function StarRating({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, rating));
  const full = Math.floor(r);
  const empty = 5 - full;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <StarIcon key={`f-${i}`} filled />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <StarIcon key={`e-${i}`} filled={false} />
      ))}
      <span className="ml-1.5 text-sm font-medium text-white/90">{r.toFixed(1)}</span>
    </div>
  );
}

function StarRatingDisplay({ rating }: { rating: number | null | undefined }) {
  if (rating == null) return null;
  const r = Math.min(5, Math.max(0, rating));
  const full = Math.floor(r);
  const empty = 5 - full;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${r} out of 5 stars`}>
      {Array.from({ length: full }).map((_, i) => (
        <StarIcon key={`f-${i}`} filled />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <StarIcon key={`e-${i}`} filled={false} />
      ))}
    </div>
  );
}

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Rate 1 to 5 stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onChange(n);
          }}
          className="rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={value >= n}
          whileHover={!disabled ? { scale: 1.2 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <StarIcon filled={value >= n} className="h-7 w-7 transition-colors duration-150" />
        </motion.button>
      ))}
    </div>
  );
}

function SectionFade({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function SalonPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [activeServiceCategory, setActiveServiceCategory] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      const { data: salonData, error: salonError } = await supabase
        .from("salons")
        .select("id, name, slug, city, address, phone")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (salonError || !salonData) {
        setError(salonError?.message ?? "Salon not found");
        setLoading(false);
        return;
      }

      setSalon(salonData);

      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("salon_id", salonData.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (servicesError) {
        setError(servicesError.message);
      } else {
        setServices(servicesData ?? []);
      }
      setLoading(false);
    }

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    async function fetchReviews() {
      try {
        const res = await fetch(`/api/salons/${slug}/reviews`);
        const data = await res.json();
        if (res.ok && data.reviews) {
          setReviews(data.reviews);
        }
      } finally {
        setReviewsLoading(false);
      }
    }

    fetchReviews();
  }, [slug]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-NP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const SERVICE_CATEGORIES = [
    { id: "face", label: "Face", keywords: ["facial", "skincare", "face mask", "cleanup", "bleach"] },
    { id: "hair", label: "Hair", keywords: ["haircut", "hair color", "hair wash", "hairstyle", "beard", "kids haircut", "head massage"] },
    { id: "nails", label: "Nails", keywords: ["manicure", "pedicure", "nail art", "gel nails"] },
    { id: "makeup", label: "Makeup", keywords: ["makeup", "bridal", "party makeup"] },
    { id: "body", label: "Body & wellness", keywords: ["massage", "waxing", "threading", "spa"] },
  ] as const;

  function getServiceCategory(service: Service): string {
    const name = service.name.toLowerCase();
    for (const cat of SERVICE_CATEGORIES) {
      if (cat.keywords.some((k) => name.includes(k.toLowerCase()))) return cat.id;
    }
    return "other";
  }

  const servicesByCategory = (() => {
    const grouped: Record<string, Service[]> = { other: [] };
    for (const cat of SERVICE_CATEGORIES) {
      grouped[cat.id] = [];
    }
    for (const svc of services) {
      const cat = getServiceCategory(svc);
      if (cat in grouped) (grouped[cat] as Service[]).push(svc);
      else grouped.other.push(svc);
    }
    return grouped;
  })();

  const getAddOnBadge = (service: Service, index: number) => {
    const popular = ["Haircut", "Facial", "Manicure", "Hair Color"].some((n) =>
      service.name.toLowerCase().includes(n.toLowerCase())
    );
    if (popular && index < 2) return { label: "Popular", className: "bg-amber-100 text-amber-800" };
    if (index % 3 === 1) return { label: "Add hair wash + NPR 150", className: "bg-stone-100 text-stone-700" };
    return null;
  };

  async function handleTestFeedback() {
    if (!slug) return;
    setTestLoading(true);
    try {
      const sampleText = "Very friendly staff, clean place, fast service!";
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: sampleText, salonSlug: slug }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => [
          {
            id: data.review_id,
            feedback: sampleText,
            created_at: new Date().toISOString(),
            rating: data.rating ?? null,
            sentiment: data.sentiment ?? null,
          },
          ...prev,
        ]);
        toast(`Review submitted. Sentiment: ${data.sentiment ?? "-"}`, "success");
      } else {
        toast(data.error ?? "Failed to submit", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Network error", "error");
    } finally {
      setTestLoading(false);
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim() || feedback.trim().length < 3 || !slug) return;
    setFeedbackStatus("submitting");
    setFeedbackError(null);
    const ratingToSend = reviewRating >= 1 && reviewRating <= 5 ? reviewRating : undefined;
    try {
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: feedback.trim(),
          salonSlug: slug,
          ...(ratingToSend != null && { rating: ratingToSend }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error ?? "Failed to submit feedback";
        setFeedbackError(errMsg);
        setFeedbackStatus("error");
        toast(errMsg, "error");
        return;
      }
      setFeedback("");
      setReviewRating(5);
      setFeedbackStatus("success");
      setReviews((prev) => [
        {
          id: data.review_id,
          feedback: feedback.trim(),
          created_at: new Date().toISOString(),
          rating: ratingToSend ?? null,
          sentiment: data.sentiment ?? null,
        },
        ...prev,
      ]);
      toast("Thanks! Your review was submitted.", "success");
    } catch {
      setFeedbackError("Network error. Please try again.");
      setFeedbackStatus("error");
      toast("Network error. Please try again.", "error");
    }
  }

  if (loading) {
    return <SalonPageSkeleton />;
  }

  if (error || !salon) {
    return (
      <ErrorAlert
        title="Failed to load salon"
        message={error ?? "This salon may not exist or is no longer available."}
        backHref="/"
        backLabel="← Back to salons"
      />
    );
  }

  const bannerIndex = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rating = getRating(slug);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero banner with overlay */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="-mx-4 -mt-2 overflow-hidden rounded-2xl sm:-mx-6 lg:-mx-8"
      >
        <div className="relative aspect-[21/9] min-h-[200px] overflow-hidden">
          <Image
            src={getSalonImage(bannerIndex)}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-stone-900/95 via-stone-900/40 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-10">
            <Link
              href="/"
              className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to salons
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {salon.city ?? "Nepal"}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Open now
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              {salon.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-white/90">
              {salon.address && <span>{salon.address}</span>}
              {salon.phone && (
                <a href={`tel:${salon.phone}`} className="hover:text-white">
                  {salon.phone}
                </a>
              )}
              <StarRating rating={rating} />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Two-column: Services + Sidebar */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Services grid */}
        <SectionFade className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-stone-900 md:text-2xl">Services</h2>
            <p className="mt-1.5 text-sm text-stone-600">
              What are you looking for? Pick a category below to see available services, then choose one and tap Book.
            </p>
            {services.length > 0 && (
              <nav
                className="mt-4 flex flex-wrap gap-2 border-b border-stone-200 pb-4"
                aria-label="Service categories"
              >
                {SERVICE_CATEGORIES.map((cat) => {
                  const items = servicesByCategory[cat.id];
                  if (!items?.length) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveServiceCategory(cat.id)}
                      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeServiceCategory === cat.id
                          ? "bg-stone-900 text-white shadow-sm"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
                {servicesByCategory.other.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveServiceCategory("other")}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeServiceCategory === "other"
                        ? "bg-stone-900 text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                    }`}
                  >
                    Other
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveServiceCategory("all")}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeServiceCategory === "all"
                      ? "bg-stone-900 text-white shadow-sm"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                  }`}
                >
                  View all
                </button>
              </nav>
            )}
          </div>
          {services.length === 0 ? (
            <EmptyStateServices />
          ) : !activeServiceCategory ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 py-16 text-center">
              <svg className="h-12 w-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="mt-4 text-sm font-medium text-stone-600">Choose a category above to see services</p>
              <p className="mt-1 text-xs text-stone-500">Face, Hair, Nails, Makeup, Body & wellness, or View all</p>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-sm text-stone-500">
                Choose a service and tap <strong>Book</strong> to pick your date and time.
              </p>
              {activeServiceCategory === "all" && (
                <>
                  {SERVICE_CATEGORIES.map((cat, catIndex) => {
                    const items = servicesByCategory[cat.id];
                    if (!items?.length) return null;
                    return (
                      <div key={cat.id}>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
                          {cat.label}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                          {items.map((service, i) => {
                            const addOn = getAddOnBadge(service, i);
                            return (
                              <motion.div
                                key={service.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: (catIndex * 6 + i) * 0.04 }}
                                whileHover={{ y: -2 }}
                                className="group flex min-h-[140px] flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-md shadow-stone-200/40 transition-shadow hover:shadow-lg"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-semibold text-stone-900">{service.name}</h3>
                                  {addOn && (
                                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${addOn.className}`}>
                                      {addOn.label}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-stone-600">
                                  {formatPrice(service.price)} · {service.duration_min} min
                                </p>
                                <Link
                                  href={`/book/${slug}/${service.id}`}
                                  className="mt-auto inline-flex w-fit items-center justify-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-stone-800 hover:shadow-lg"
                                >
                                  Book
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {servicesByCategory.other.length > 0 && (
                    <div>
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
                        Other
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                        {servicesByCategory.other.map((service, i) => {
                          const addOn = getAddOnBadge(service, services.length + i);
                          return (
                            <motion.div
                              key={service.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, delay: i * 0.04 }}
                              whileHover={{ y: -2 }}
                              className="group flex min-h-[140px] flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-md shadow-stone-200/40 transition-shadow hover:shadow-lg"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-stone-900">{service.name}</h3>
                                {addOn && (
                                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${addOn.className}`}>
                                    {addOn.label}
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-stone-600">
                                {formatPrice(service.price)} · {service.duration_min} min
                              </p>
                              <Link
                                href={`/book/${slug}/${service.id}`}
                                className="mt-auto inline-flex w-fit items-center justify-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-stone-800 hover:shadow-lg"
                              >
                                Book
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
              {activeServiceCategory !== "all" && activeServiceCategory !== "other" && (() => {
                const cat = SERVICE_CATEGORIES.find((c) => c.id === activeServiceCategory);
                const items = cat ? servicesByCategory[cat.id] : [];
                if (!cat || !items?.length) return null;
                return (
                  <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                    {items.map((service, i) => {
                      const addOn = getAddOnBadge(service, i);
                      return (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.04 }}
                          whileHover={{ y: -2 }}
                          className="group flex min-h-[140px] flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-md shadow-stone-200/40 transition-shadow hover:shadow-lg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-stone-900">{service.name}</h3>
                            {addOn && (
                              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${addOn.className}`}>
                                {addOn.label}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-stone-600">
                            {formatPrice(service.price)} · {service.duration_min} min
                          </p>
                          <Link
                            href={`/book/${slug}/${service.id}`}
                            className="mt-auto inline-flex w-fit items-center justify-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-stone-800 hover:shadow-lg"
                          >
                            Book
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
              {activeServiceCategory === "other" && servicesByCategory.other.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
                  {servicesByCategory.other.map((service, i) => {
                    const addOn = getAddOnBadge(service, services.length + i);
                    return (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.04 }}
                        whileHover={{ y: -2 }}
                        className="group flex min-h-[140px] flex-col rounded-2xl border border-stone-200/80 bg-white p-5 shadow-md shadow-stone-200/40 transition-shadow hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-stone-900">{service.name}</h3>
                          {addOn && (
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${addOn.className}`}>
                              {addOn.label}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-stone-600">
                          {formatPrice(service.price)} · {service.duration_min} min
                        </p>
                        <Link
                          href={`/book/${slug}/${service.id}`}
                          className="mt-auto inline-flex w-fit items-center justify-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-stone-800 hover:shadow-lg"
                        >
                          Book
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </SectionFade>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          <SectionFade>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-lg shadow-stone-200/30">
              <h3 className="font-bold text-stone-900">About salon</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                A trusted salon serving customers with quality services. Book your appointment online for a seamless experience.
              </p>
            </div>
          </SectionFade>

          <SectionFade>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-lg shadow-stone-200/30">
              <h3 className="font-bold text-stone-900">Working hours</h3>
              <ul className="mt-3 space-y-2">
                {WORKING_HOURS.map((row) => (
                  <li key={row.day} className="flex justify-between text-sm text-stone-600">
                    <span>{row.day}</span>
                    <span>{row.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionFade>

          {(salon.phone) && (
            <SectionFade>
              <div className="flex flex-col gap-3">
                <a
                  href={`tel:${salon.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-stone-900 bg-white py-3 text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-50"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </a>
                <a
                  href={`https://wa.me/${salon.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#20bd5a]"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </SectionFade>
          )}
        </div>
      </div>

      {/* Review form - above reviews */}
      <SectionFade>
        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white to-stone-50/50 p-6 shadow-xl shadow-stone-200/30 sm:p-8">
          <h2 className="text-xl font-bold text-stone-900">Leave a review</h2>
          <p className="mt-2 text-sm text-stone-600">
            Share your experience. We use AI to analyze feedback and improve our service.
          </p>
          <form onSubmit={handleFeedbackSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">Rating</label>
              <p className="mt-1 text-xs text-stone-500">Click to rate 1–5 stars (optional)</p>
              <StarRatingInput
                value={reviewRating}
                onChange={setReviewRating}
                disabled={feedbackStatus === "submitting"}
              />
            </div>
            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-stone-700">
                Your feedback
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Great haircut, friendly staff! Would definitely recommend."
                rows={4}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                disabled={feedbackStatus === "submitting"}
                minLength={3}
              />
            </div>
            {feedbackError && (
              <p className="text-sm text-red-600">{feedbackError}</p>
            )}
            {feedbackStatus === "success" && (
              <p className="flex items-center gap-2 text-sm text-emerald-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Thanks! Your review was submitted.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={feedbackStatus === "submitting" || feedback.trim().length < 3}
                className="rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {feedbackStatus === "submitting" ? "Submitting…" : "Submit review"}
              </button>
              {process.env.NODE_ENV !== "production" && (
                <button
                  type="button"
                  onClick={handleTestFeedback}
                  disabled={testLoading}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
                >
                  {testLoading ? "Testing…" : "Test AI feedback"}
                </button>
              )}
            </div>
          </form>
        </div>
      </SectionFade>

      {/* Reviews */}
      <SectionFade>
        <div>
          <h2 className="mb-6 text-xl font-bold text-stone-900 md:text-2xl">Reviews</h2>
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200/80" aria-hidden />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyStateReviews />
          ) : (
            <ul className="space-y-4">
              {reviews.map((review, i) => (
                <motion.li
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-md shadow-stone-200/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {review.rating != null && (
                        <StarRatingDisplay rating={review.rating} />
                      )}
                    </div>
                    <span className="text-xs text-stone-500">{formatDate(review.created_at)}</span>
                  </div>
                  <p className="mt-3 text-stone-700 leading-relaxed">{review.feedback}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </SectionFade>
    </div>
  );
}
