"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { getSalonImage } from "@/lib/images";
import { SalonCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyStateSearch } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

type Salon = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  services?: { price: number; name?: string }[];
};

function getRating(slug: string): number {
  const h = slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 4.2 + (h % 8) / 10;
}

function SectionFade({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, rating));
  const full = Math.floor(r);
  const empty = 5 - full;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`f-${i}`} className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`e-${i}`} className="h-4 w-4 text-stone-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs font-medium text-stone-500">{r.toFixed(1)}</span>
    </div>
  );
}

export default function HomePage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  useEffect(() => {
    async function fetchSalons() {
      const { data: salonData, error: salonErr } = await supabase
        .from("salons")
        .select("id, name, slug, city, address, phone, services(price, name)")
        .eq("is_active", true)
        .order("name");

      if (salonErr) {
        setError(salonErr.message);
        setLoading(false);
        return;
      }

      setSalons((salonData ?? []) as Salon[]);
      setLoading(false);
    }
    fetchSalons();
  }, []);

  const filtered = useMemo(() => {
    const loc = locationSearch.trim().toLowerCase();
    const svc = serviceSearch.trim().toLowerCase();
    if (!loc && !svc) return salons;
    return salons.filter((s) => {
      const matchLoc = !loc || [s.name, s.city, s.address].some((v) => v?.toLowerCase().includes(loc));
      const matchSvc = !svc || (s.services?.some((v) => v.name?.toLowerCase().includes(svc)) ?? false);
      return matchLoc && matchSvc;
    });
  }, [salons, locationSearch, serviceSearch]);

  const featuredSalons = filtered.slice(0, 6);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(amount);

  const getMinPrice = (salon: Salon) => {
    const prices = salon.services?.map((s) => s.price).filter(Boolean) ?? [];
    return prices.length ? Math.min(...prices) : 0;
  };

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load salons"
        message="We couldn't load the salon list. Please check your connection and try again."
        backHref="/"
        backLabel="Refresh page"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-12 pb-16 md:space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/50 px-6 py-16 shadow-xl shadow-stone-200/50 ring-1 ring-stone-200/60 md:px-12 md:py-24 lg:px-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.2),transparent)]" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm backdrop-blur-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              Free to book
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl md:text-6xl"
            >
              Book your perfect
              <br />
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                salon appointment
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-6 max-w-xl text-lg text-stone-600 md:text-xl"
            >
              Discover top salons across Nepal. Search by city or service, compare prices, and book instantly.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto mt-10 w-full max-w-3xl"
            >
              <div className="overflow-hidden rounded-2xl border-2 border-stone-200/80 bg-white shadow-2xl shadow-stone-300/40 ring-1 ring-stone-100 transition-shadow focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px] gap-0">
                  <div className="flex items-center gap-4 border-b border-stone-100 px-5 py-4 sm:border-b-0 sm:border-r border-stone-100">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Location (e.g. Kathmandu)"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-base text-stone-800 placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-4 border-b border-stone-100 px-5 py-4 sm:border-b-0 sm:border-r border-stone-100">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.242 4.243 3 3 0 004.242-4.243zm0-5.758a3 3 0 10-4.242-4.243 3 3 0 004.242 4.243z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Service (e.g. Haircut, Facial)"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-base text-stone-800 placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                  <Link
                    href={
                      locationSearch.trim() || serviceSearch.trim()
                        ? `/salons?${new URLSearchParams({
                            ...(locationSearch.trim() && { city: locationSearch.trim() }),
                            ...(serviceSearch.trim() && { q: serviceSearch.trim() }),
                          }).toString()}`
                        : "/salons"
                    }
                    className="flex w-full min-w-[140px] items-center justify-center gap-2 whitespace-nowrap bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-4 text-base font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98]"
                  >
                    Search
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </Link>
                </div>
                {(locationSearch || serviceSearch) && (
                  <div className="flex items-center justify-center gap-2 border-t border-stone-100 bg-stone-50/90 px-4 py-3">
                    <span className="text-sm text-stone-500">Filters active</span>
                    <button
                      type="button"
                      onClick={() => { setLocationSearch(""); setServiceSearch(""); }}
                      className="text-sm font-medium text-amber-700 hover:text-amber-800 underline underline-offset-2"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Popular cities */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mx-auto mt-8 max-w-2xl"
            >
              <p className="text-sm font-medium text-stone-500">Popular cities</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {["Kathmandu", "Lalitpur", "Pokhara"].map((city) => (
                  <Link
                    key={city}
                    href={`/salons?city=${encodeURIComponent(city)}`}
                    className="rounded-full border-2 border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 hover:shadow-md"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured salons */}
      <SectionFade id="featured">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">Featured salons</h2>
              <p className="mt-1 text-stone-600">Top-rated salons ready to book</p>
            </div>
            <Link
              href="/salons"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
            >
              View all salons
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <div className="mb-4" />

          {(locationSearch.trim() || serviceSearch.trim()) && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3">
              <span className="text-sm text-stone-700">
                Showing results for
                {locationSearch.trim() && (
                  <span className="font-medium text-stone-900"> {locationSearch.trim()}</span>
                )}
                {locationSearch.trim() && serviceSearch.trim() && " · "}
                {serviceSearch.trim() && (
                  <span className="font-medium text-stone-900"> {serviceSearch.trim()}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  setLocationSearch("");
                  setServiceSearch("");
                }}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                Clear filters to see all
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SalonCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredSalons.length === 0 ? (
            <EmptyStateSearch
              onClear={
                locationSearch || serviceSearch
                  ? () => {
                      setLocationSearch("");
                      setServiceSearch("");
                    }
                  : undefined
              }
              title={
                locationSearch || serviceSearch
                  ? "No salons match your search"
                  : "No salons found"
              }
              description={
                locationSearch || serviceSearch
                  ? "Try a different location or service name."
                  : "Run the seed to add sample data, or check back later."
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredSalons.map((salon, i) => {
                const minPrice = getMinPrice(salon);
                const rating = getRating(salon.slug);
                return (
                  <motion.div
                    key={salon.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    whileHover={{ y: -6 }}
                    className="group"
                  >
                    <Link
                      href={`/salons/${salon.slug}`}
                      className="flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-lg shadow-stone-200/40 transition-all duration-300 hover:border-amber-200/80 hover:shadow-xl hover:shadow-amber-100/30"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        <Image
                          src={getSalonImage(i)}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized
                        />
                        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-stone-700 shadow-md backdrop-blur">
                          {salon.city ?? "Nepal"}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-stone-900 group-hover:text-amber-800">{salon.name}</h3>
                          <StarRating rating={rating} />
                        </div>
                        {salon.address && (
                          <p className="mt-1 line-clamp-2 text-sm text-stone-500">{salon.address}</p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
                            From {formatPrice(minPrice || 200)}
                          </span>
                          <span className="text-sm font-medium text-stone-900 group-hover:underline">
                            View →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
          {!loading && filtered.length > 6 && (
            <p className="mt-6 text-center text-sm text-stone-500">
              Showing 6 of {filtered.length} salons. Refine your search to see more.
            </p>
          )}
        </div>
      </SectionFade>

      {/* Salon owners CTA */}
      <SectionFade>
        <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-amber-50/50 to-stone-50 p-8 shadow-sm md:p-12">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-xl font-bold text-stone-900 md:text-2xl">Own a salon?</h2>
              <p className="mt-2 max-w-md text-stone-600">
                Join Salon Booking Nepal and reach more customers. List your services, manage bookings, and grow your business.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
              >
                Register your salon
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </Link>
              <Link
                href="/owner"
                className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
              >
                Owner login
              </Link>
            </div>
          </div>
        </div>
      </SectionFade>

      {/* How it works */}
      <SectionFade id="how-it-works">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm md:p-10">
          <h2 className="text-center text-2xl font-bold text-stone-900 md:text-3xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-stone-600">Book your salon appointment in three simple steps</p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="mt-4 text-sm font-semibold text-amber-600">Step 1</span>
              <h3 className="mt-1 font-semibold text-stone-900">Search & discover</h3>
              <p className="mt-2 text-sm text-stone-600">Find salons by city or service. Compare prices and read reviews.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="mt-4 text-sm font-semibold text-amber-600">Step 2</span>
              <h3 className="mt-1 font-semibold text-stone-900">Pick time & book</h3>
              <p className="mt-2 text-sm text-stone-600">Choose your preferred date and slot. Enter your details and confirm instantly.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="mt-4 text-sm font-semibold text-amber-600">Step 3</span>
              <h3 className="mt-1 font-semibold text-stone-900">Enjoy your visit</h3>
              <p className="mt-2 text-sm text-stone-600">Get confirmed, message the salon on WhatsApp, or check My bookings anytime.</p>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/salons"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Start booking
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </SectionFade>

      {/* Features */}
      <SectionFade>
        <div>
          <h2 className="text-center text-2xl font-bold text-stone-900 md:text-3xl">Why book with us</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-stone-600">Everything you need for a smooth salon experience</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Instant booking</h3>
                <p className="mt-1 text-sm text-stone-600">See available slots and confirm in seconds. No phone calls needed.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Real reviews</h3>
                <p className="mt-1 text-sm text-stone-600">Read honest reviews and ratings from customers before you book.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">WhatsApp support</h3>
                <p className="mt-1 text-sm text-stone-600">Contact salons directly via WhatsApp to confirm or reschedule.</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Free cancellation</h3>
                <p className="mt-1 text-sm text-stone-600">Cancel or reschedule free of charge up to 24 hours before your appointment.</p>
              </div>
            </div>
          </div>
        </div>
      </SectionFade>
    </div>
  );
}
