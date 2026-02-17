"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { getSalonImage } from "@/lib/images";
import { BookingPageSkeleton } from "@/components/ui/Skeleton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useToast } from "@/context/ToastContext";

type Salon = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  phone: string | null;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration_min: number;
};

const bookingSchema = z.object({
  customer_name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  customer_phone: z.string().min(1, "Phone is required").max(50, "Phone is too long"),
  customer_email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  notes: z.string().max(1000, "Notes are too long").optional(),
  date: z.string().min(1, "Date is required"),
  slot_iso: z.string().min(1, "Please select a time slot"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

function getWhatsAppUrl(phone: string | null): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const num = digits.length === 10 && digits.startsWith("9") ? `977${digits}` : digits.startsWith("977") ? digits : `977${digits}`;
  return `https://wa.me/${num}`;
}

const STEPS = [
  { key: "service", label: "Service", num: 1 },
  { key: "details", label: "Details", num: 2 },
  { key: "confirm", label: "Confirm", num: 3 },
] as const;

export default function BookingPage() {
  const params = useParams();
  const salonSlug = params.salonSlug as string;
  const serviceId = params.serviceId as string;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookedDateTime, setBookedDateTime] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (!salonSlug || !serviceId) return;

    async function fetchData() {
      const { data: salonData, error: salonError } = await supabase
        .from("salons")
        .select("id, name, slug, city, phone")
        .eq("slug", salonSlug)
        .eq("is_active", true)
        .single();

      if (salonError || !salonData) {
        setError("Salon not found");
        setLoading(false);
        return;
      }

      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("id", serviceId)
        .eq("salon_id", salonData.id)
        .eq("is_active", true)
        .single();

      if (serviceError || !serviceData) {
        setError("Service not found or does not belong to this salon");
        setLoading(false);
        return;
      }

      setSalon(salonData);
      setService(serviceData);
      setLoading(false);
    }

    fetchData();
  }, [salonSlug, serviceId]);

  useEffect(() => {
    if (!salon || !service || !selectedDate) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    const dateStr = selectedDate.trim();
    const ymd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const mdy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const dateParam = ymd
      ? dateStr
      : mdy
        ? `${mdy[3]}-${mdy[1]!.padStart(2, "0")}-${mdy[2]!.padStart(2, "0")}`
        : "";
    if (!dateParam) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    const url = `/api/slots?salonSlug=${encodeURIComponent(salon.slug)}&serviceId=${encodeURIComponent(service.id)}&date=${encodeURIComponent(dateParam)}`;
    fetch(url)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        setSlots(ok && Array.isArray(data.slots) ? data.slots : []);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [salon?.slug, salon?.id, service?.id, selectedDate]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(amount);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    setStatus("submitting");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const slotIso = selectedSlot ?? (formData.get("slot_iso") as string)?.trim() ?? "";
    const raw: Partial<BookingFormData> = {
      customer_name: (formData.get("customer_name") as string)?.trim() ?? "",
      customer_phone: (formData.get("customer_phone") as string)?.trim() ?? "",
      customer_email: (formData.get("customer_email") as string)?.trim() ?? "",
      notes: (formData.get("notes") as string)?.trim() ?? "",
      date: (formData.get("date") as string) ?? "",
      slot_iso: slotIso,
    };

    const parsed = bookingSchema.safeParse({
      ...raw,
      customer_email: raw.customer_email || undefined,
      notes: raw.notes || undefined,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const err of parsed.error.issues) {
        const path = String(err.path[0] ?? "");
        if (path && !errors[path]) errors[path] = err.message;
      }
      setFieldErrors(errors);
      setStatus("error");
      return;
    }

    const { customer_name, customer_phone, customer_email, notes, date, slot_iso } =
      parsed.data;

    const startTime = new Date(slot_iso).toISOString();

    if (!salon || !service) return;

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salon_id: salon.id,
        service_id: service.id,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        notes: notes || null,
        start_time: startTime,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      const errMsg = result.error ?? "Failed to create booking. Please try again.";
      setSubmitError(errMsg);
      setStatus("error");
      toast(errMsg, "error");
      return;
    }

    setBookingId(result.id);
    setBookedDateTime(new Date(slot_iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }));
    setStatus("success");
    toast("Booking confirmed!", "success");
  }

  if (loading) {
    return <BookingPageSkeleton />;
  }

  if (error || !salon || !service) {
    return (
      <ErrorAlert
        title="Unable to load booking"
        message={error ?? "This salon or service may not exist or is no longer available."}
        backHref={`/salons/${salonSlug}`}
        backLabel="← Back to salon"
        onRetry={() => window.location.reload()}
      />
    );
  }

  const whatsappUrl = getWhatsAppUrl(salon.phone);
  const bannerIndex = salonSlug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header + Stepper */}
      <div>
        <Link
          href={`/salons/${salonSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {salon.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          Book appointment
        </h1>

        {/* Stepper */}
        <div className="mt-8 flex items-center gap-2 sm:gap-4">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    i < 2
                      ? "bg-stone-900 text-white"
                      : "border-2 border-stone-300 bg-white text-stone-600"
                  }`}
                >
                  {i < 2 ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span className="hidden text-sm font-medium text-stone-700 sm:inline">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 bg-stone-200 sm:mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "success" && bookingId && bookedDateTime ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-xl sm:p-12"
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              >
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h2 className="mt-6 text-2xl font-bold text-emerald-900 sm:text-3xl">
                Booking requested
              </h2>
              <p className="mt-3 max-w-md text-stone-600">
                Your appointment for <strong className="text-stone-900">{service.name}</strong> at{" "}
                <strong className="text-stone-900">{salon.name}</strong> has been submitted. The salon will confirm shortly.
              </p>

              <div className="mt-8 w-full max-w-sm rounded-2xl border border-emerald-200/80 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-stone-500">Date & time</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">{bookedDateTime}</p>
                <p className="mt-2 font-mono text-xs text-stone-400">Booking ID: {bookingId}</p>
              </div>

              <p className="mt-4 text-xs text-stone-500">
                Times are in the salon&apos;s timezone. The salon will confirm your appointment.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/booking/${bookingId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-stone-900 bg-white px-6 py-3.5 font-semibold text-stone-900 shadow-lg transition-all hover:bg-stone-50"
                >
                  View booking details
                </Link>
                <Link
                  href="/salons"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-stone-800"
                >
                  Back to salons
                </Link>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-[#20bd5a]"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Message on WhatsApp
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="grid gap-8 lg:grid-cols-3"
          >
            {/* Left: Summary card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xl shadow-stone-200/30">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={getSalonImage(bannerIndex)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-stone-500">
                    Booking summary
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-stone-500">Salon</p>
                      <p className="mt-0.5 font-semibold text-stone-900">{salon.name}</p>
                      {salon.city && <p className="text-sm text-stone-600">{salon.city}</p>}
                    </div>
                    <div className="border-t border-stone-100 pt-4">
                      <p className="text-xs font-medium text-stone-500">Service</p>
                      <p className="mt-0.5 font-semibold text-stone-900">{service.name}</p>
                      <p className="mt-2 text-lg font-bold text-stone-900">
                        {formatPrice(service.price)}
                      </p>
                      <p className="text-sm text-stone-600">{service.duration_min} min</p>
                    </div>
                  </div>
                  <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Free cancellation up to 24 hours before your appointment. Contact the salon to reschedule.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Form card */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xl shadow-stone-200/30">
                <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-5 sm:px-8">
                  <h2 className="text-lg font-bold text-stone-900">Your details</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    We&apos;ll use this to confirm your appointment.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                  <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="customer_name" className="block text-sm font-medium text-stone-700">
                          Full name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="customer_name"
                          name="customer_name"
                          type="text"
                          autoComplete="name"
                          placeholder="e.g. Ram Sharma"
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                            fieldErrors.customer_name
                              ? "border-red-400 focus:border-red-500"
                              : "border-stone-300 focus:border-amber-500"
                          }`}
                        />
                        {fieldErrors.customer_name && (
                          <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {fieldErrors.customer_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="customer_phone" className="block text-sm font-medium text-stone-700">
                          Phone number <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="customer_phone"
                          name="customer_phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="e.g. 9841234567"
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                            fieldErrors.customer_phone
                              ? "border-red-400 focus:border-red-500"
                              : "border-stone-300 focus:border-amber-500"
                          }`}
                        />
                        <p className="mt-1 text-xs text-stone-500">For confirmation and reminders</p>
                        {fieldErrors.customer_phone && (
                          <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {fieldErrors.customer_phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="customer_email" className="block text-sm font-medium text-stone-700">
                        Email <span className="text-stone-400">(optional)</span>
                      </label>
                      <input
                        id="customer_email"
                        name="customer_email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                          fieldErrors.customer_email
                            ? "border-red-400 focus:border-red-500"
                            : "border-stone-300 focus:border-amber-500"
                        }`}
                      />
                      {fieldErrors.customer_email && (
                        <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors.customer_email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-stone-700">
                        Preferred date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="date"
                        name="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 10)}
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                          fieldErrors.date
                            ? "border-red-400 focus:border-red-500"
                            : "border-stone-300 focus:border-amber-500"
                        }`}
                      />
                      {fieldErrors.date && (
                        <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors.date}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700">
                        Available time slots <span className="text-red-500">*</span>
                      </label>
                      <p className="mt-1 text-xs text-stone-500">
                        Select a date first, then choose a slot. Times in salon&apos;s local timezone.
                      </p>
                      {selectedDate && (
                        <>
                          {slotsLoading ? (
                            <p className="mt-3 text-sm text-stone-500">Loading slots…</p>
                          ) : (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {slots.length === 0 ? (
                                <p className="text-sm text-stone-500">No available slots for this date.</p>
                              ) : (
                                slots.map((slot) => {
                                  const isSelected = selectedSlot === slot;
                                  const label = new Date(slot).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => setSelectedSlot(slot)}
                                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                                        isSelected
                                          ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                                          : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                          <input type="hidden" name="slot_iso" value={selectedSlot ?? ""} />
                        </>
                      )}
                      {fieldErrors.slot_iso && (
                        <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {fieldErrors.slot_iso}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-stone-700">
                        Special requests <span className="text-stone-400">(optional)</span>
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        placeholder="e.g. Prefer morning slot, need wheelchair access"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                          fieldErrors.notes
                            ? "border-red-400 focus:border-red-500"
                            : "border-stone-300 focus:border-amber-500"
                        }`}
                      />
                      {fieldErrors.notes && (
                        <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                          {fieldErrors.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {submitError && (
                    <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <svg className="mt-0.5 h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {submitError}
                    </div>
                  )}

                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[200px]"
                    >
                      {status === "submitting" ? (
                        <>
                          <svg
                            className="h-5 w-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Confirming…
                        </>
                      ) : (
                        "Confirm booking"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
