import { NextRequest } from "next/server";
import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00.000Z`;
  const todayEnd = `${today}T23:59:59.999Z`;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString();

  const [
    { data: bookingsTodayData },
    { data: upcomingData },
    { data: salesWeekData },
    { data: reviewsData },
    { data: bookingsRangeData },
    { data: salesRangeData },
  ] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("salon_id", salon.id)
      .gte("start_time", todayStart)
      .lte("start_time", todayEnd)
      .neq("status", "cancelled"),
    supabaseAdmin
      .from("bookings")
      .select("id")
      .eq("salon_id", salon.id)
      .gte("start_time", new Date().toISOString())
      .eq("status", "confirmed"),
    supabaseAdmin
      .from("sales")
      .select("total")
      .eq("salon_id", salon.id)
      .gte("created_at", weekStart),
    supabaseAdmin
      .from("reviews")
      .select("id, rating")
      .eq("salon_id", salon.id),
    supabaseAdmin
      .from("bookings")
      .select("start_time")
      .eq("salon_id", salon.id)
      .gte("start_time", weekStart)
      .neq("status", "cancelled"),
    supabaseAdmin
      .from("sales")
      .select("total, created_at")
      .eq("salon_id", salon.id)
      .gte("created_at", weekStart),
  ]);

  const bookingsToday = (bookingsTodayData ?? []).length;
  const upcomingConfirmed = (upcomingData ?? []).length;
  const revenue7d = (salesWeekData ?? []).reduce((s, r) => s + (r.total ?? 0), 0);

  const reviews = reviewsData ?? [];
  const reviewIds = reviews.map((r) => r.id);
  let sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  if (reviewIds.length > 0) {
    const { data: ai } = await supabaseAdmin
      .from("feedback_ai")
      .select("sentiment")
      .in("review_id", reviewIds);
    for (const row of ai ?? []) {
      const s = (row.sentiment ?? "neutral").toLowerCase();
      if (s in sentimentCounts) sentimentCounts[s as keyof typeof sentimentCounts]++;
      else sentimentCounts.neutral++;
    }
  }

  const withRating = reviews.filter((r) => typeof (r as { rating?: number }).rating === "number");
  const avgRating =
    withRating.length > 0
      ? withRating.reduce((s, r) => s + ((r as { rating: number }).rating ?? 0), 0) / withRating.length
      : null;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const bookingsByDay = days.map((date) => {
    const start = `${date}T00:00:00.000Z`;
    const end = `${date}T23:59:59.999Z`;
    const count = (bookingsRangeData ?? []).filter(
      (b) => b.start_time >= start && b.start_time <= end
    ).length;
    return { date, bookings: count };
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
    sales: salesByDayMap.get(date) ?? 0,
  }));

  return Response.json({
    salon: { id: salon.id, name: salon.name, slug: salon.slug },
    cards: {
      bookingsToday,
      upcomingConfirmed,
      revenue7d,
      avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
      sentimentCounts,
    },
    charts: {
      bookingsByDay,
      salesByDay,
    },
  });
}
