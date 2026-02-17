import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { OwnerBookingsTable } from "./OwnerBookingsTable";

type Props = { params: Promise<{ ownerKey: string }> };

export default async function OwnerDashboardPage({ params }: Props) {
  const { ownerKey } = await params;
  if (!ownerKey) notFound();

  const { data: salon, error: salonError } = await supabaseAdmin
    .from("salons")
    .select("id, name, slug, owner_key")
    .eq("owner_key", ownerKey)
    .single();

  if (salonError || !salon) notFound();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { data: todayBookings },
    { data: upcomingBookings },
    { data: completedBookings },
    { data: reviews },
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
      .gte("start_time", monthStart.toISOString()),
    supabaseAdmin
      .from("reviews")
      .select("id, rating, feedback")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const serviceIds = [
    ...new Set([
      ...(todayBookings ?? []).map((b) => b.service_id),
      ...(upcomingBookings ?? []).map((b) => b.service_id),
      ...(completedBookings ?? []).map((b) => b.service_id),
    ]),
  ];
  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name, price")
    .in("id", serviceIds);
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const revenueThisMonth = (completedBookings ?? []).reduce(
    (sum, b) => sum + (serviceMap.get(b.service_id)?.price ?? 0),
    0
  );

  const reviewIds = (reviews ?? []).map((r) => r.id);
  let sentimentMap: Record<string, string> = {};
  if (reviewIds.length > 0) {
    const { data: ai } = await supabaseAdmin
      .from("feedback_ai")
      .select("review_id, sentiment")
      .in("review_id", reviewIds);
    sentimentMap = (ai ?? []).reduce((acc, row) => ({ ...acc, [row.review_id]: row.sentiment }), {});
  }

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  for (const r of reviews ?? []) {
    const s = (sentimentMap[r.id] ?? "neutral").toLowerCase();
    if (s in sentimentCounts) (sentimentCounts as Record<string, number>)[s]++;
  }

  const ratings = (reviews ?? []).filter((r) => typeof (r as { rating?: number }).rating === "number");
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + ((r as { rating: number }).rating ?? 0), 0) / ratings.length
      : null;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">{salon.name}</h1>
            <p className="mt-1 text-sm text-stone-600">Owner dashboard</p>
          </div>
          <Link
            href={`/salons/${salon.slug}`}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            View public page
          </Link>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">Today</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">{(todayBookings ?? []).length}</p>
            <p className="mt-1 text-xs text-stone-500">bookings</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">Upcoming</p>
            <p className="mt-2 text-3xl font-bold text-stone-900">{(upcomingBookings ?? []).length}</p>
            <p className="mt-1 text-xs text-stone-500">next 10</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">Revenue (month)</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{formatPrice(revenueThisMonth)}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">Reviews</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">
              {avgRating != null ? `${avgRating.toFixed(1)} ★` : "-"}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {sentimentCounts.positive} pos · {sentimentCounts.neutral} neu · {sentimentCounts.negative} neg
            </p>
          </div>
        </div>

        {/* Today & upcoming */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-stone-900">Today&apos;s appointments</h2>
            {(todayBookings ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">No appointments today.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {(todayBookings ?? []).map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                    <div>
                      <p className="font-medium text-stone-900">{b.customer_name}</p>
                      <p className="text-sm text-stone-600">{serviceMap.get(b.service_id)?.name ?? "-"}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-stone-900">{formatTime(b.start_time)}</span>
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-stone-900">Upcoming</h2>
            {(upcomingBookings ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">No upcoming appointments.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {(upcomingBookings ?? []).map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/50 p-3">
                    <div>
                      <p className="font-medium text-stone-900">{b.customer_name}</p>
                      <p className="text-sm text-stone-600">{serviceMap.get(b.service_id)?.name ?? "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-stone-900">
                        {new Date(b.start_time).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sentiment */}
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-stone-900">Reviews sentiment</h2>
          <p className="mt-1 text-sm text-stone-500">Based on customer feedback analysis</p>
          <div className="mt-6 flex gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-emerald-700">Positive</span>
                <span>{sentimentCounts.positive}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: (reviews?.length ?? 0)
                      ? `${(sentimentCounts.positive / reviews!.length) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-amber-700">Neutral</span>
                <span>{sentimentCounts.neutral}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: (reviews?.length ?? 0)
                      ? `${(sentimentCounts.neutral / reviews!.length) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-red-700">Negative</span>
                <span>{sentimentCounts.negative}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{
                    width: (reviews?.length ?? 0)
                      ? `${(sentimentCounts.negative / reviews!.length) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Manage bookings */}
        <div className="mt-8">
          <OwnerBookingsTable ownerKey={ownerKey} salonId={salon.id} salonName={salon.name} />
        </div>
      </div>
    </div>
  );
}
