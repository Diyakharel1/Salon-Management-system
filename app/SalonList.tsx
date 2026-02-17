"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Salon = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
};

export function SalonList({ salons }: { salons: Salon[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return salons;
    return salons.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.city?.toLowerCase().includes(q) ?? false)
    );
  }, [salons, search]);

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="search" className="sr-only">
          Search by name or city
        </label>
        <input
          id="search"
          type="search"
          placeholder="Search by name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          {search ? "No salons match your search." : "No salons found."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((salon) => (
            <li key={salon.id}>
              <article className="flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <h2 className="font-semibold text-zinc-900">{salon.name}</h2>
                {salon.city && (
                  <p className="mt-1 text-sm text-zinc-600">{salon.city}</p>
                )}
                {salon.address && (
                  <p className="mt-1 text-sm text-zinc-500">{salon.address}</p>
                )}
                {salon.phone && (
                  <p className="mt-1 text-sm text-zinc-500">{salon.phone}</p>
                )}
                <Link
                  href={`/salons/${salon.slug}`}
                  className="mt-4 inline-flex w-fit items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  View & Book
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
