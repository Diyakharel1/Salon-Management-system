-- Multi-salon booking MVP schema (no auth)
-- Run in Supabase SQL Editor

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text NOT NULL,
  address text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  price integer NOT NULL,
  duration_min integer NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  notes text,
  start_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_services_salon_id ON services(salon_id);
CREATE INDEX idx_bookings_salon_id ON bookings(salon_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);

-- Prevent double booking: same salon + time can't be booked twice
CREATE UNIQUE INDEX IF NOT EXISTS bookings_salon_time_unique ON bookings (salon_id, start_time);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- salons: allow SELECT to anon and authenticated only where is_active = true
CREATE POLICY "anon_select_active_salons"
  ON salons FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "authenticated_select_active_salons"
  ON salons FOR SELECT
  TO authenticated
  USING (is_active = true);

-- services: allow SELECT to anon and authenticated only where is_active = true
CREATE POLICY "anon_select_active_services"
  ON services FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "authenticated_select_active_services"
  ON services FOR SELECT
  TO authenticated
  USING (is_active = true);

-- bookings: INSERT only via server route /api/bookings (no direct anon/authenticated insert)
REVOKE INSERT ON bookings FROM anon;
REVOKE INSERT ON bookings FROM authenticated;

-- =============================================================================
-- SALES (Bill OCR - admin only, no public access)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  total integer,
  raw_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  name text NOT NULL,
  price integer
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- For MVP: no public access (insert via supabaseAdmin server routes only)
REVOKE ALL ON sales FROM anon;
REVOKE ALL ON sales_items FROM anon;

-- =============================================================================
-- REVIEWS + FEEDBACK_AI (Sentiment - insert via API route)
-- =============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  feedback text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
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
