-- Reviews + Feedback AI tables (Step 9)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  feedback text NOT NULL,
  created_at timestamptz DEFAULT now()
);

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
