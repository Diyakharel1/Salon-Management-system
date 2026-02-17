"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  baseUrl: string;
  filterSentiment: string | null;
  filterRating: number | null;
};

export function AdminFeedbackFilters({
  baseUrl,
  filterSentiment,
  filterRating,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get("key");

  function updateFilters(sentiment: string, rating: string) {
    const params = new URLSearchParams();
    if (key) params.set("key", key);
    if (sentiment && sentiment !== "all") params.set("sentiment", sentiment);
    if (rating && rating !== "all") params.set("rating", rating);
    const qs = params.toString();
    router.push(`/admin/feedback${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="sentiment-filter" className="text-sm font-medium text-stone-600">
          Sentiment:
        </label>
        <select
          id="sentiment-filter"
          value={filterSentiment ?? "all"}
          onChange={(e) =>
            updateFilters(e.target.value, filterRating != null ? String(filterRating) : "all")
          }
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="all">All</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="rating-filter" className="text-sm font-medium text-stone-600">
          Rating:
        </label>
        <select
          id="rating-filter"
          value={filterRating != null ? String(filterRating) : "all"}
          onChange={(e) =>
            updateFilters(filterSentiment ?? "all", e.target.value)
          }
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="all">All</option>
          <option value="5">5★</option>
          <option value="4">4★</option>
          <option value="3">3★</option>
          <option value="2">2★</option>
          <option value="1">1★</option>
        </select>
      </div>
    </div>
  );
}
