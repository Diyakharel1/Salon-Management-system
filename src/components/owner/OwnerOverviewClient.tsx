"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Analytics = {
  salon: { id: string; name: string; slug: string };
  cards: {
    bookingsToday: number;
    upcomingConfirmed: number;
    revenue7d: number;
    avgRating: number | null;
    sentimentCounts: { positive: number; neutral: number; negative: number };
  };
  charts: {
    bookingsByDay: { date: string; bookings: number }[];
    salesByDay: { date: string; sales: number }[];
  };
};

export function OwnerOverviewClient({
  ownerKey,
  salonName,
}: {
  ownerKey: string;
  salonName: string;
}) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `/api/owner/analytics?key=${encodeURIComponent(ownerKey)}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load dashboard."));
  }, [ownerKey]);

  const keyQ = `?key=${encodeURIComponent(ownerKey)}`;
  const cardClass =
    "rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md";

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50 p-6 text-red-800 shadow-sm">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-stone-200/80 bg-white shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  const { cards, charts } = data;
  const sentimentTotal =
    cards.sentimentCounts.positive +
    cards.sentimentCounts.neutral +
    cards.sentimentCounts.negative;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">Overview</h1>
        <p className="mt-1 text-stone-600">{salonName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/owner/bookings${keyQ}`} className={cardClass}>
          <p className="text-sm font-medium text-stone-500">Bookings today</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{cards.bookingsToday}</p>
        </Link>
        <Link href={`/owner/bookings${keyQ}`} className={cardClass}>
          <p className="text-sm font-medium text-stone-500">Upcoming confirmed</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{cards.upcomingConfirmed}</p>
        </Link>
        <Link href={`/owner/sales${keyQ}`} className={cardClass}>
          <p className="text-sm font-medium text-stone-500">Revenue (7 days)</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            NPR {cards.revenue7d.toLocaleString()}
          </p>
        </Link>
        <Link href={`/owner/reviews${keyQ}`} className={cardClass}>
          <p className="text-sm font-medium text-stone-500">Avg rating</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            {cards.avgRating != null ? `${cards.avgRating} ★` : "-"}
          </p>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">Bookings (last 7 days)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.bookingsByDay}>
                <defs>
                  <linearGradient id="ownerBookingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
                <YAxis tick={{ fontSize: 12 }} stroke="#78716c" />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4" }} />
                <Area type="monotone" dataKey="bookings" stroke="#d97706" strokeWidth={2} fill="url(#ownerBookingsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur">
          <h3 className="font-semibold text-stone-900">Sales (last 7 days)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
                <YAxis tick={{ fontSize: 12 }} stroke="#78716c" tickFormatter={(v) => `NPR ${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4" }} />
                <Bar dataKey="sales" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Sentiment breakdown</h2>
        <p className="mt-0.5 text-sm text-stone-500">Review sentiment (all time)</p>
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-emerald-700">Positive</span>
              <span className="text-stone-600">{cards.sentimentCounts.positive}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: sentimentTotal ? `${(cards.sentimentCounts.positive / sentimentTotal) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-amber-700">Neutral</span>
              <span className="text-stone-600">{cards.sentimentCounts.neutral}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: sentimentTotal ? `${(cards.sentimentCounts.neutral / sentimentTotal) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-red-700">Negative</span>
              <span className="text-stone-600">{cards.sentimentCounts.negative}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-red-500 transition-all"
                style={{
                  width: sentimentTotal ? `${(cards.sentimentCounts.negative / sentimentTotal) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
