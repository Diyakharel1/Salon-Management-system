import { NextRequest } from "next/server";
import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from("reviews")
    .select("id, feedback, rating, created_at")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (reviewsError) {
    return Response.json({ error: reviewsError.message }, { status: 500 });
  }

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
          sentiment: (row.sentiment ?? "neutral").toLowerCase(),
          keywords: Array.isArray(row.keywords) ? row.keywords : [],
        },
      }),
      {} as Record<string, { sentiment: string; keywords: string[] }>
    );
  }

  const list = (reviews ?? []).map((r) => ({
    id: r.id,
    feedback: r.feedback,
    rating: (r as { rating?: number }).rating ?? null,
    created_at: r.created_at,
    sentiment: aiMap[r.id]?.sentiment ?? "neutral",
    keywords: aiMap[r.id]?.keywords ?? [],
  }));

  const withRating = list.filter((r) => r.rating != null);
  const avgRating =
    withRating.length > 0
      ? withRating.reduce((s, r) => s + (r.rating ?? 0), 0) / withRating.length
      : null;

  return Response.json({
    reviews: list,
    avgRating: avgRating != null ? Math.round(avgRating * 10) / 10 : null,
  });
}
