"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { getSalonImage } from "@/lib/images";
import { SalonCardSkeleton } from "@/components/ui/Skeleton";
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

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
] as const;

export default function AllSalonsPage() {
  const searchParams = useSearchParams();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("recommended");

  useEffect(() => {
    const city = searchParams.get("city")?.trim();
    const q = searchParams.get("q")?.trim();
    if (city) setSelectedCity(city);
    if (q) setSearch(q);
  }, [searchParams]);

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

  const cities = useMemo(() => {
    const set = new Set<string>();
    salons.forEach((s) => {
      if (s.city?.trim()) set.add(s.city.trim());
    });
    return Array.from(set).sort();
  }, [salons]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(amount);

  const getMinPrice = (salon: Salon) => {
    const prices = salon.services?.map((s) => s.price).filter(Boolean) ?? [];
    return prices.length ? Math.min(...prices) : 0;
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = salons.filter((s) => {
      const matchCity = !selectedCity || s.city === selectedCity;
      const matchSearch =
        !q ||
        [s.name, s.city, s.address].some((v) => v?.toLowerCase().includes(q)) ||
        (s.services?.some((svc) => svc.name?.toLowerCase().includes(q)) ?? false);
      return matchCity && matchSearch;
    });

    const getSalonRating = (s: Salon) => getRating(s.slug);
    const getSalonMinPrice = (s: Salon) => getMinPrice(s);

    switch (sort) {
      case "rating":
        list = [...list].sort((a, b) => getSalonRating(b) - getSalonRating(a));
        break;
      case "price-low":
        list = [...list].sort((a, b) => getSalonMinPrice(a) - getSalonMinPrice(b));
        break;
      case "price-high":
        list = [...list].sort((a, b) => getSalonMinPrice(b) - getSalonMinPrice(a));
        break;
      case "name":
        list = [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        break;
      default:
        break;
    }
    return list;
  }, [salons, search, selectedCity, sort]);

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load salons"
        message={error}
        backHref="/"
      />
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">All salons</h1>
        <p className="mt-2 text-stone-600">Browse, filter, and book from our full list of salons across Nepal.</p>
      </div>

      {/* Compact filter bar - single row, minimal visual weight */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6 flex flex-col gap-3 border-b border-stone-200/60 pb-4 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search name, city or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={selectedCity ?? ""}
            onChange={(e) => setSelectedCity(e.target.value || null)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200"
            aria-label="Filter by city"
          >
            <option value="">All locations</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORT_OPTIONS)[number]["value"])}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {(search.trim() || selectedCity) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCity(null);
              }}
              className="text-sm text-stone-500 hover:text-stone-800"
            >
              Clear
            </button>
          )}
        </div>
        <span className="text-sm text-stone-500 sm:ml-auto">
          {filteredAndSorted.length} salon{filteredAndSorted.length !== 1 ? "s" : ""}
        </span>
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SalonCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
            <svg className="h-8 w-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">No salons match your filters</h2>
          <p className="mt-2 text-stone-500">Try changing the location or search term.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCity(null);
            }}
            className="mt-6 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-amber-600"
          >
            Clear filters
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((salon, i) => {
              const minPrice = getMinPrice(salon);
              const rating = getRating(salon.slug);
              return (
                <motion.div
                  key={salon.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
                  whileHover={{ y: -6 }}
                  className="group"
                >
                  <Link
                    href={`/salons/${salon.slug}`}
                    className="flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-lg shadow-stone-200/40 transition-all duration-300 hover:border-amber-200/80 hover:shadow-xl hover:shadow-amber-100/30"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
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
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
