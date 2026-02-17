import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ownerKey: string }> }
) {
  const { ownerKey } = await params;
  if (!ownerKey) {
    return NextResponse.json({ error: "Missing owner key" }, { status: 400 });
  }

  const { data: salon, error: salonError } = await supabaseAdmin
    .from("salons")
    .select("id, name, slug")
    .eq("owner_key", ownerKey)
    .single();

  if (salonError || !salon) {
    return NextResponse.json({ error: "Salon not found or invalid owner key" }, { status: 404 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { data: todayBookings },
    { data: upcomingBookings },
    { data: completedForRevenue },
    { data: reviewsWithSentiment },
  ] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id, start_time, status, customer_name, service_id")
      .eq("salon_id", salon.id)
      .in("status", ["pending", "confirmed"])
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString())
      .order("start_time", { ascending: true }),
    supabaseAdmin
      .from("bookings")
      .select("id, start_time, status, customer_name, service_id")
      .eq("salon_id", salon.id)
      .in("status", ["pending", "confirmed"])
      .gt("start_time", todayEnd.toISOString())
      .order("start_time", { ascending: true })
      .limit(10),
    supabaseAdmin
      .from("bookings")
      .select("service_id")
      .eq("salon_id", salon.id)
      .eq("status", "completed")
      .gte("start_time", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    supabaseAdmin
      .from("reviews")
      .select("id, rating, feedback")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const serviceIds = [
    ...new Set([
      ...(todayBookings ?? []).map((b) => b.service_id),
      ...(upcomingBookings ?? []).map((b) => b.service_id),
      ...(completedForRevenue ?? []).map((b) => b.service_id),
    ]),
  ];
  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name, price")
    .in("id", serviceIds);
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const revenueThisMonth = (completedForRevenue ?? []).reduce((sum, b) => {
    const svc = serviceMap.get(b.service_id);
    return sum + (svc?.price ?? 0);
  }, 0);

  const reviewIds = (reviewsWithSentiment ?? []).map((r) => r.id);
  let sentimentMap: Record<string, string> = {};
  if (reviewIds.length > 0) {
    const { data: ai } = await supabaseAdmin
      .from("feedback_ai")
      .select("review_id, sentiment")
      .in("review_id", reviewIds);
    sentimentMap = (ai ?? []).reduce((acc, row) => ({ ...acc, [row.review_id]: row.sentiment }), {});
  }

  const ratings = (reviewsWithSentiment ?? []).filter((r) => typeof (r as { rating?: number }).rating === "number");
  const avgRating = ratings.length > 0
    ? ratings.reduce((s, r) => s + ((r as { rating: number }).rating ?? 0), 0) / ratings.length
    : null;

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  for (const r of reviewsWithSentiment ?? []) {
    const s = sentimentMap[r.id] ?? "neutral";
    if (s in sentimentCounts) (sentimentCounts as Record<string, number>)[s]++;
  }

  return NextResponse.json({
    salon: { id: salon.id, name: salon.name, slug: salon.slug },
    today: (todayBookings ?? []).map((b) => ({
      id: b.id,
      start_time: b.start_time,
      status: b.status,
      customer_name: b.customer_name,
      service_name: serviceMap.get(b.service_id)?.name ?? null,
    })),
    upcoming: (upcomingBookings ?? []).map((b) => ({
      id: b.id,
      start_time: b.start_time,
      status: b.status,
      customer_name: b.customer_name,
      service_name: serviceMap.get(b.service_id)?.name ?? null,
    })),
    revenue_this_month: revenueThisMonth,
    reviews: {
      count: reviewsWithSentiment?.length ?? 0,
      avg_rating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
      sentiment: sentimentCounts,
    },
  });
}
