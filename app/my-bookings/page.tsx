"use client";

import Link from "next/link";
import { useState } from "react";

type BookingRow = {
  id: string;
  start_time: string;
  status: string;
  customer_name: string;
  created_at: string;
  salon_name: string | null;
  salon_slug: string | null;
  service_name: string | null;
};

export default function MyBookingsPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = phone.trim().replace(/\D/g, "");
    if (raw.length < 7) {
      setError("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    setError(null);
    setLoading(true);
    setBookings(null);
    try {
      const res = await fetch(`/api/my-bookings?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load bookings.");
        return;
      }
      setBookings(data.bookings ?? []);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const now = new Date().toISOString();
  const upcoming = (bookings ?? []).filter((b) => b.start_time >= now && b.status === "confirmed");
  const past = (bookings ?? []).filter((b) => b.start_time < now || b.status !== "confirmed");

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">My bookings</h1>
        <p className="mt-2 text-stone-600">
          Enter the phone number you used when booking to see your appointments.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700">
          Phone number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 9841234567"
          className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-70"
        >
          {loading ? "Loading…" : "View my bookings"}
        </button>
      </form>

      {bookings && (
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-8 text-center shadow-sm">
              <p className="font-medium text-stone-900">No bookings found</p>
              <p className="mt-1 text-sm text-stone-500">
                No appointments found for this phone number. Book one from our salons.
              </p>
              <Link
                href="/salons"
                className="mt-4 inline-flex rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Browse salons
              </Link>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-stone-900">Upcoming</h2>
                  <ul className="mt-3 space-y-3">
                    {upcoming.map((b) => (
                      <li key={b.id}>
                        <Link
                          href={`/booking/${b.id}`}
                          className="block rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-stone-900">{b.salon_name ?? "Salon"}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                b.status === "confirmed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {b.status === "confirmed" ? "Confirmed" : "Pending"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-stone-600">{b.service_name ?? "-"}</p>
                          <p className="mt-1 text-sm font-medium text-stone-900">{formatDate(b.start_time)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-stone-900">Past</h2>
                  <ul className="mt-3 space-y-3">
                    {past.map((b) => (
                      <li key={b.id}>
                        <Link
                          href={`/booking/${b.id}`}
                          className="block rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-stone-900">{b.salon_name ?? "Salon"}</span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                b.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-stone-100 text-stone-700"
                              }`}
                            >
                              {b.status === "cancelled" ? "Cancelled" : "Completed"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-stone-600">{b.service_name ?? "-"}</p>
                          <p className="mt-1 text-sm text-stone-500">{formatDate(b.start_time)}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-center text-sm text-stone-500">
        <Link href="/salons" className="text-amber-600 hover:text-amber-700">
          Browse salons
        </Link>
        {" · "}
        <Link href="/" className="text-amber-600 hover:text-amber-700">
          Home
        </Link>
      </p>
    </div>
  );
}
