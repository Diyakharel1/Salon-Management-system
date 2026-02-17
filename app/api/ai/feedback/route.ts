import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";

export const dynamic = "force-dynamic";

const RATE_LIMIT_LIMIT = 6;
const RATE_LIMIT_WINDOW_SECONDS = 60;

const getNlpEndpoint = () => {
  const base = process.env.NEXT_PUBLIC_AI_BASE_URL;
  const path = "/api/nlp/feedback";
  return `${base?.replace(/\/$/, "")}${path}`;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const key = `feedback:${ip}`;

  let rl;
  try {
    rl = await rateLimitOrThrow({
      key,
      limit: RATE_LIMIT_LIMIT,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    });
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return NextResponse.json(
      { error: "Rate limit unavailable. Please try again later." },
      { status: 503 }
    );
  }

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many feedback submissions. Please wait a minute and try again." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_LIMIT),
          "X-RateLimit-Remaining": String(rl.remaining),
          "X-RateLimit-Reset": rl.resetAt,
        },
      }
    );
  }

  try {
    let body: { feedback?: string; comment?: string; salonSlug?: string; rating?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const feedback = (body.feedback ?? body.comment)?.toString()?.trim();
    const salonSlug = body.salonSlug?.toString()?.trim();
    const rating =
      typeof body.rating === "number" &&
      Number.isInteger(body.rating) &&
      body.rating >= 1 &&
      body.rating <= 5
        ? body.rating
        : null;

    if (!feedback || feedback.length < 3) {
      return NextResponse.json(
        { error: "Feedback text is required (min 3 characters)" },
        { status: 400 }
      );
    }

    if (!salonSlug) {
      return NextResponse.json(
        { error: "salonSlug is required" },
        { status: 400 }
      );
    }

    const { data: salon, error: salonError } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("slug", salonSlug)
      .eq("is_active", true)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: "Salon not found or inactive" },
        { status: 400 }
      );
    }

    // 1. Insert review first
    const reviewInsert: { salon_id: string; feedback: string; rating?: number } = {
      salon_id: salon.id,
      feedback,
    };
    if (rating !== null) reviewInsert.rating = rating;

    const { data: review, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .insert(reviewInsert)
      .select("id")
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: reviewError?.message ?? "Failed to save review" },
        { status: 500 }
      );
    }

    // 2. Call FastAPI for sentiment analysis
    const nlpUrl = getNlpEndpoint();
    let nlpResponse: Response;
    try {
      nlpResponse = await fetch(nlpUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
    } catch (err) {
      return NextResponse.json(
        {
          error: `Failed to reach AI backend: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
        { status: 502 }
      );
    }

    let nlpJson: {
      sentiment?: string;
      confidence?: number;
      polarity?: number;
      subjectivity?: number;
      keywords?: string[];
      detail?: string;
      message?: string;
    };

    try {
      nlpJson = await nlpResponse.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid response from AI backend" },
        { status: 502 }
      );
    }

    if (!nlpResponse.ok) {
      const errMsg =
        nlpJson.detail ?? nlpJson.message ?? nlpResponse.statusText ?? "Sentiment analysis failed";
      return NextResponse.json(
        { error: errMsg },
        { status: nlpResponse.status >= 500 ? 502 : 400 }
      );
    }

    let sentiment = (nlpJson.sentiment ?? "neutral").toLowerCase();
    if (sentiment !== "positive" && sentiment !== "negative") sentiment = "neutral";

    // When user gave a star rating, use it for accurate sentiment (overrides NLP)
    if (rating !== null) {
      if (rating <= 2) sentiment = "negative";
      else if (rating >= 4) sentiment = "positive";
      else sentiment = "neutral";
    }

    const confidence = typeof nlpJson.confidence === "number" ? nlpJson.confidence : 0;
    const polarity = typeof nlpJson.polarity === "number" ? nlpJson.polarity : 0;
    const subjectivity = typeof nlpJson.subjectivity === "number" ? nlpJson.subjectivity : 0;
    const keywords = Array.isArray(nlpJson.keywords) ? nlpJson.keywords : [];

    // 3. Insert feedback_ai
    const { error: aiError } = await supabaseAdmin.from("feedback_ai").insert({
      review_id: review.id,
      sentiment,
      confidence,
      polarity,
      subjectivity,
      keywords,
    });

    if (aiError) {
      return NextResponse.json(
        { error: aiError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review_id: review.id,
      sentiment,
      confidence,
      polarity,
      subjectivity,
      keywords,
      rating: rating ?? undefined,
    });
  } catch (err) {
    console.error("Feedback sentiment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
