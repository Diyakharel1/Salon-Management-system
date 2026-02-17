import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const { data: salon, error: salonError } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (salonError || !salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .select("id, feedback, rating, created_at")
      .eq("salon_id", salon.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (reviewsError) {
      return NextResponse.json(
        { error: reviewsError.message },
        { status: 500 }
      );
    }

    const reviewIds = (reviews ?? []).map((r) => r.id);
    let sentimentMap: Record<string, string> = {};

    if (reviewIds.length > 0) {
      const { data: aiData } = await supabaseAdmin
        .from("feedback_ai")
        .select("review_id, sentiment")
        .in("review_id", reviewIds);
      sentimentMap = (aiData ?? []).reduce(
        (acc, row) => ({ ...acc, [row.review_id]: row.sentiment }),
        {} as Record<string, string>
      );
    }

    const normalized = (reviews ?? []).map((r) => ({
      id: r.id,
      feedback: r.feedback,
      rating: typeof (r as { rating?: number }).rating === "number" ? (r as { rating: number }).rating : null,
      created_at: r.created_at,
      sentiment: sentimentMap[r.id] ?? null,
    }));

    return NextResponse.json({ reviews: normalized });
  } catch (err) {
    console.error("Reviews fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
