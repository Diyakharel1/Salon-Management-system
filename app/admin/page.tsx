import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminOverviewCharts } from "@/components/admin/AdminOverviewCharts";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

const FEEDBACK_DAYS = Math.max(1, Math.min(365, parseInt(process.env.ADMIN_FEEDBACK_DAYS ?? "30", 10) || 30));

type SalonImprovementNote = {
  salonId: string;
  salonName: string;
  totalReviews: number;
  avgRating: number | null;
  improvementAreas: string[];
  noteParagraph: string;
};

function buildImprovementNote(
  totalReviews: number,
  negativeCount: number,
  neutralCount: number,
  avgRating: number | null,
  improvementAreas: string[]
): string {
  if (totalReviews === 0) {
    return `No feedback in the last ${FEEDBACK_DAYS} days. Encourage customers to leave reviews.`;
  }
  const parts: string[] = [];
  if (improvementAreas.length > 0) {
    parts.push(`Focus on improving: ${improvementAreas.slice(0, 7).join(", ")}.`);
  }
  if (avgRating != null) {
    parts.push(`Average rating this period: ${avgRating.toFixed(1)}/5.`);
  }
  if (negativeCount > 0) {
    parts.push(
      `${negativeCount} negative review${negativeCount === 1 ? "" : "s"} and ${neutralCount} neutral.`
    );
  }
  if (parts.length === 0) {
    return `No major issues from feedback. Average rating: ${avgRating != null ? avgRating.toFixed(1) + "/5" : "-"}. Keep up the good work.`;
  }
  return parts.join(" ");
}

function getLast7Days(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default async function AdminOverviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key;

  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return <AdminLoginForm redirectPath="/admin" />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00.000Z`;
  const todayEnd = `${today}T23:59:59.999Z`;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString();

  const sinceForNotes = new Date();
  sinceForNotes.setDate(sinceForNotes.getDate() - FEEDBACK_DAYS);
  const sinceIso = sinceForNotes.toISOString();

  // Parallel fetch for faster load
  const [
    { data: bookingsTodayData },
    { data: upcomingBookingsData },
    { data: salesThisWeek },
    { data: feedbackData },
    { data: bookingsRangeData },
    { data: salesRangeData },
    { data: salonsData },
    { data: reviewsLast30Data },
  ] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id")
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .neq("status", "cancelled"),
    supabaseAdmin
      .from("bookings")
      .select("id")
      .gte("start_time", new Date().toISOString())
      .neq("status", "cancelled"),
    supabaseAdmin.from("sales").select("total").gte("created_at", weekStart),
    supabaseAdmin.from("feedback_ai").select("sentiment"),
    supabaseAdmin
      .from("bookings")
      .select("start_time")
      .gte("start_time", weekStart)
      .neq("status", "cancelled"),
    supabaseAdmin.from("sales").select("total, created_at").gte("created_at", weekStart),
    supabaseAdmin.from("salons").select("id, name, slug"),
    supabaseAdmin
      .from("reviews")
      .select("id, salon_id, rating, created_at")
      .gte("created_at", sinceIso),
  ]);

  const bookingsToday = (bookingsTodayData ?? []).length;
  const upcomingBookings = (upcomingBookingsData ?? []).length;
  const salesTotal = (salesThisWeek ?? []).reduce((sum, s) => sum + (s.total ?? 0), 0);

  const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
  for (const row of feedbackData ?? []) {
    const s = (row.sentiment ?? "neutral").toLowerCase();
    if (s in sentimentCounts) {
      sentimentCounts[s as keyof typeof sentimentCounts]++;
    } else {
      sentimentCounts.neutral++;
    }
  }
  const sentimentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);

  const days = getLast7Days();
  const bookingsByDay = days.map((date) => {
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;
    const count = (bookingsRangeData ?? []).filter(
      (b) => b.start_time >= dayStart && b.start_time <= dayEnd
    ).length;
    return { date, bookings: count, sales: 0 };
  });

  const salesByDayMap = new Map<string, number>();
  days.forEach((d) => salesByDayMap.set(d, 0));
  for (const row of salesRangeData ?? []) {
    const date = (row.created_at ?? "").slice(0, 10);
    if (salesByDayMap.has(date)) {
      salesByDayMap.set(date, (salesByDayMap.get(date) ?? 0) + (row.total ?? 0));
    }
  }
  const salesByDay = days.map((date) => ({
    date,
    bookings: bookingsByDay.find((d) => d.date === date)?.bookings ?? 0,
    sales: salesByDayMap.get(date) ?? 0,
  }));

  // Monthly improvement notes: need feedback_ai for reviews from last 30 days
  const reviewList = reviewsLast30Data ?? [];
  const reviewIds = reviewList.map((r) => r.id);
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
          sentiment: (row.sentiment ?? "neutral").toLowerCase(),
          keywords: Array.isArray(row.keywords) ? row.keywords : [],
        },
      }),
      {} as Record<string, { sentiment: string; keywords: string[] }>
    );
  }

  const salonIdToReviews = new Map<
    string,
    { rating: number | null; sentiment: string; keywords: string[] }[]
  >();
  for (const r of reviewList) {
    const ai = aiMap[r.id];
    const sentiment = ai?.sentiment ?? "neutral";
    const keywords = ai?.keywords ?? [];
    const rating =
      typeof (r as { rating?: number }).rating === "number"
        ? (r as { rating: number }).rating
        : null;
    const list = salonIdToReviews.get(r.salon_id) ?? [];
    list.push({ rating, sentiment, keywords });
    salonIdToReviews.set(r.salon_id, list);
  }

  const salonList = salonsData ?? [];
  const improvementNotes: SalonImprovementNote[] = salonList.map((salon) => {
    const list = salonIdToReviews.get(salon.id) ?? [];
    const totalReviews = list.length;
    const negativeCount = list.filter((x) => x.sentiment === "negative").length;
    const neutralCount = list.filter((x) => x.sentiment === "neutral").length;
    const withRating = list.filter((x) => x.rating != null);
    const avgRating =
      withRating.length > 0
        ? withRating.reduce((s, x) => s + (x.rating ?? 0), 0) / withRating.length
        : null;

    const negativeKeywords: Record<string, number> = {};
    for (const x of list) {
      if (x.sentiment !== "negative") continue;
      for (const kw of x.keywords) {
        const k = String(kw).toLowerCase().trim();
        if (k) negativeKeywords[k] = (negativeKeywords[k] ?? 0) + 1;
      }
    }
    const improvementAreas = Object.entries(negativeKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([kw]) => kw);

    const noteParagraph = buildImprovementNote(
      totalReviews,
      negativeCount,
      neutralCount,
      avgRating,
      improvementAreas
    );

    return {
      salonId: salon.id,
      salonName: salon.name,
      totalReviews,
      avgRating,
      improvementAreas,
      noteParagraph,
    };
  });

  const keyQ = key ? `?key=${encodeURIComponent(key)}` : "";

  const cardClass =
    "rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur transition-all hover:shadow-xl hover:shadow-amber-200/20 hover:border-amber-300/80";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Overview</h1>
        <p className="mt-1 text-sm text-stone-600">
          Dashboard summary and quick stats
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/admin/bookings${keyQ}`} className={cardClass}>
          <p className="text-sm font-medium text-stone-500">Bookings today</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{bookingsToday}</p>
        </Link>
        <Link href={`/admin/bookings${keyQ}`} className={cardClass}>
          <p className="text-sm font-medium text-stone-500">Upcoming</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{upcomingBookings}</p>
        </Link>
        <Link href={`/admin/sales${keyQ}`} className={cardClass}>
          <p className="text-sm font-medium text-stone-500">Sales this week</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">
            NPR {(salesTotal ?? 0).toLocaleString()}
          </p>
        </Link>
        <Link href={`/admin/feedback${keyQ}`} className={cardClass}>
          <p className="text-sm font-medium text-stone-500">Reviews</p>
          <p className="mt-2 text-3xl font-bold text-stone-900">{sentimentTotal}</p>
        </Link>
      </div>

      {/* Charts */}
      <AdminOverviewCharts
        bookingsByDay={bookingsByDay}
        salesByDay={salesByDay}
        sentimentCounts={sentimentCounts}
      />

      {/* Sentiment bars (compact) */}
      <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur">
        <h2 className="font-semibold text-stone-900">Sentiment breakdown</h2>
        <p className="mt-0.5 text-sm text-stone-500">Review sentiment distribution</p>
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-emerald-700">Positive</span>
              <span className="text-stone-600">{sentimentCounts.positive}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: sentimentTotal
                    ? `${(sentimentCounts.positive / sentimentTotal) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-amber-700">Neutral</span>
              <span className="text-stone-600">{sentimentCounts.neutral}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{
                  width: sentimentTotal
                    ? `${(sentimentCounts.neutral / sentimentTotal) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-red-700">Negative</span>
              <span className="text-stone-600">{sentimentCounts.negative}</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-red-500 transition-all"
                style={{
                  width: sentimentTotal
                    ? `${(sentimentCounts.negative / sentimentTotal) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly improvement notes (based on feedback) */}
      <section className="rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Monthly improvement notes (based on feedback)
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Summary of which salon needs to improve in what. Use these notes to send to salons each month.
            </p>
          </div>
          <Link
            href={`/admin/feedback${keyQ}`}
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
          >
            View all feedback →
          </Link>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Based on the last {FEEDBACK_DAYS} days of customer reviews and AI sentiment/keywords.
        </p>

        <div className="mt-6 space-y-4">
          {improvementNotes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-amber-200/60 bg-amber-50/50 p-6 text-center text-sm text-stone-500">
              No salons found. Add salons to see improvement notes.
            </p>
          ) : (
            improvementNotes.map((note) => (
              <div
                key={note.salonId}
                className="rounded-xl border border-stone-200 bg-stone-50/50 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-stone-900">{note.salonName}</h3>
                  <span className="text-xs text-stone-500">
                    {note.totalReviews} review{note.totalReviews === 1 ? "" : "s"} this period
                    {note.avgRating != null && ` · ${note.avgRating.toFixed(1)} ★ avg`}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-700">
                  {note.noteParagraph}
                </p>
                {note.improvementAreas.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {note.improvementAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
