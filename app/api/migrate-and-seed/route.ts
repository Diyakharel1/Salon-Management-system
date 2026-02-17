import { NextResponse } from "next/server";
import { headers } from "next/headers";
import postgres from "postgres";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  feedback text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating integer;

CREATE TABLE IF NOT EXISTS feedback_ai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  sentiment text NOT NULL,
  confidence real NOT NULL,
  polarity real NOT NULL,
  subjectivity real NOT NULL,
  keywords jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_salon_id ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_feedback_ai_review_id ON feedback_ai(review_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_ai ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON reviews FROM anon;
REVOKE ALL ON feedback_ai FROM anon;
`;

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  const headerSecret = (await headers()).get("x-seed-secret");
  if (!secret || headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      {
        error: "DATABASE_URL not set. This optional route needs the Supabase connection string (Project Settings > Database). Use .env.example keys only; add DATABASE_URL to .env.local only if you use this migrate endpoint.",
      },
      { status: 500 }
    );
  }

  try {
    const sql = postgres(dbUrl, { max: 1 });
    await sql.unsafe(MIGRATION_SQL);
    await sql.end();

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : request.headers.get("x-forwarded-host")
        ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host")}`
        : "http://localhost:3000";
    const seedRes = await fetch(`${baseUrl}/api/seed?mode=full`, {
      method: "POST",
      headers: { "x-seed-secret": secret },
    });
    const seedData = await seedRes.json();

    return NextResponse.json({
      message: "Migration and seed completed",
      migration: "reviews + feedback_ai tables created",
      seed: seedData,
    });
  } catch (err) {
    console.error("Migrate error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}
