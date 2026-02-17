import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { AdminFeedbackFilters } from "./AdminFeedbackFilters";
import { EmptyStateTable } from "@/components/ui/EmptyState";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from "@/components/admin/AdminTable";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

type Props = {
  searchParams: Promise<{ key?: string; sentiment?: string; rating?: string }>;
};

type ReviewRow = {
  id: string;
  feedback: string;
  created_at: string;
  salon_id: string;
  rating: number | null;
  sentiment: string | null;
  keywords: string[];
};

function StarRatingDisplay({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-stone-400">-</span>;
  const r = Math.min(5, Math.max(0, rating));
  const full = Math.floor(r);
  const empty = 5 - full;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${r} stars`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f-${i}`} className="text-amber-500">★</span>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e-${i}`} className="text-stone-300">☆</span>
      ))}
    </span>
  );
}

export default async function AdminFeedbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key;
  const filterSentiment = params.sentiment?.toLowerCase();
  const filterRating = params.rating ? parseInt(params.rating, 10) : null;

  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return <AdminLoginForm redirectPath="/admin/feedback" />;
  }

  const baseUrl = `/admin/feedback?key=${encodeURIComponent(key)}`;

  let { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("id, feedback, rating, created_at, salon_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const reviewIds = (reviews ?? []).map((r) => r.id);
  let aiMap: Record<string, { sentiment: string; keywords: string[] }> = {};

  if (reviewIds.length > 0) {
    const { data: aiData } = await supabaseAdmin
      .from("feedback_ai")
      .select("review_id, sentiment, keywords")
      .in("review_id", reviewIds);
    aiMap = (aiData ?? []).reduce(
      (acc, row) => ({
        ...acc,
        [row.review_id]: {
          sentiment: row.sentiment ?? "neutral",
          keywords: Array.isArray(row.keywords) ? row.keywords : [],
        },
      }),
      {} as Record<string, { sentiment: string; keywords: string[] }>
    );
  }

  const allRows: ReviewRow[] = (reviews ?? []).map((r) => {
    const ai = aiMap[r.id];
    const rating = typeof (r as { rating?: number }).rating === "number" ? (r as { rating: number }).rating : null;
    return {
      id: r.id,
      feedback: r.feedback,
      created_at: r.created_at,
      salon_id: r.salon_id,
      rating,
      sentiment: ai?.sentiment ?? null,
      keywords: ai?.keywords ?? [],
    };
  });

  // Summary stats from full dataset
  const totalReviews = allRows.length;
  const reviewsWithRating = allRows.filter((r) => r.rating != null);
  const avgRating =
    reviewsWithRating.length > 0
      ? reviewsWithRating.reduce((s, r) => s + (r.rating ?? 0), 0) / reviewsWithRating.length
      : null;
  const positiveCount = allRows.filter((r) => r.sentiment?.toLowerCase() === "positive").length;
  const pctPositive = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

  // Apply filters for table
  let rows = [...allRows];
  if (filterSentiment) {
    rows = rows.filter((r) => r.sentiment?.toLowerCase() === filterSentiment);
  }
  if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
    rows = rows.filter((r) => r.rating === filterRating);
  }
  rows = rows.slice(0, 50);

  const total = rows.length;
  const positive = rows.filter((r) => r.sentiment?.toLowerCase() === "positive").length;
  const negative = rows.filter((r) => r.sentiment?.toLowerCase() === "negative").length;
  const neutral = rows.filter(
    (r) => r.sentiment?.toLowerCase() === "neutral" || !r.sentiment
  ).length;

  const keywordCounts: Record<string, number> = {};
  for (const row of rows) {
    for (const kw of row.keywords) {
      const k = String(kw).toLowerCase().trim();
      if (k) keywordCounts[k] = (keywordCounts[k] ?? 0) + 1;
    }
  }
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const { data: salons } = await supabaseAdmin
    .from("salons")
    .select("id, name, slug");
  const salonMap = (salons ?? []).reduce(
    (acc, s) => ({ ...acc, [s.id]: s }),
    {} as Record<string, { name: string; slug: string }>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Feedback Insights</h1>
        <p className="mt-1 text-sm text-stone-600">
          AI sentiment analysis and keyword extraction from customer reviews
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-md">
          <p className="text-sm font-medium text-stone-500">Total reviews</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{totalReviews}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-md">
          <p className="text-sm font-medium text-amber-700">Avg rating</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {avgRating != null ? avgRating.toFixed(1) + " ★" : "-"}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-md">
          <p className="text-sm font-medium text-emerald-700">% Positive</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{pctPositive}%</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-md">
          <p className="text-sm font-medium text-stone-500">Showing</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{total} of {totalReviews}</p>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10" />}>
        <AdminFeedbackFilters
          baseUrl={baseUrl}
          filterSentiment={filterSentiment ?? null}
          filterRating={filterRating}
        />
      </Suspense>

      {/* Top keywords */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-md">
        <h2 className="font-semibold text-stone-900">Top 10 keywords</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {topKeywords.length === 0 ? (
            <p className="text-sm text-stone-500">No keywords yet</p>
          ) : (
            topKeywords.map(([kw, count]) => (
              <span
                key={kw}
                className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700"
              >
                {kw} ({count})
              </span>
            ))
          )}
        </div>
      </div>

      {/* Reviews table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-stone-900">Latest 50 reviews</h2>
        <AdminTable>
          <AdminTableHeader>
            <AdminTableHeaderCell>Salon</AdminTableHeaderCell>
            <AdminTableHeaderCell>Rating</AdminTableHeaderCell>
            <AdminTableHeaderCell>Feedback</AdminTableHeaderCell>
            <AdminTableHeaderCell>Sentiment</AdminTableHeaderCell>
            <AdminTableHeaderCell>Keywords</AdminTableHeaderCell>
            <AdminTableHeaderCell>Date</AdminTableHeaderCell>
          </AdminTableHeader>
          <AdminTableBody>
            {rows.map((row) => (
              <AdminTableRow key={row.id}>
                <AdminTableCell className="whitespace-nowrap font-medium text-stone-900">
                  {salonMap[row.salon_id]?.name ?? "-"}
                </AdminTableCell>
                <AdminTableCell>
                  <StarRatingDisplay rating={row.rating} />
                </AdminTableCell>
                <AdminTableCell className="max-w-xs">
                  <span className="line-clamp-2">{row.feedback}</span>
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge
                    status={row.sentiment ?? "-"}
                    variant={
                      row.sentiment === "positive"
                        ? "positive"
                        : row.sentiment === "negative"
                          ? "negative"
                          : "neutral"
                    }
                  />
                </AdminTableCell>
                <AdminTableCell className="text-stone-600">
                  {row.keywords.length > 0
                    ? row.keywords.slice(0, 5).join(", ") +
                      (row.keywords.length > 5 ? "…" : "")
                    : "-"}
                </AdminTableCell>
                <AdminTableCell className="whitespace-nowrap text-stone-500">
                  {new Date(row.created_at).toLocaleDateString()}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminTable>
      </div>

      {rows.length === 0 && (
        <EmptyStateTable
          title="No reviews yet"
          description="Customer reviews will appear here once they're submitted."
        />
      )}
    </div>
  );
}
