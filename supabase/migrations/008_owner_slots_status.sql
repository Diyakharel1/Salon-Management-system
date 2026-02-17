-- Salon Owner role + slot booking + status workflow
-- Run in Supabase SQL Editor (or via migrate route)

-- =============================================================================
-- 1. SALONS: owner_key, timezone, open_time, close_time
-- =============================================================================

ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_key text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kathmandu';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS open_time time DEFAULT '10:00';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS close_time time DEFAULT '20:00';

COMMENT ON COLUMN salons.owner_key IS 'Random string for MVP login-less owner access';

-- =============================================================================
-- 2. BOOKINGS: end_time, expanded status (pending, confirmed, completed, cancelled, no_show)
-- =============================================================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- Drop old unique index (we do overlap checks in API now)
DROP INDEX IF EXISTS bookings_salon_time_unique;

-- Alter status: first allow new values, then set default
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- Migrate existing: confirmed|cancelled|completed stay; default new to pending
UPDATE bookings SET status = 'pending' WHERE status NOT IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending';

-- Backfill end_time for existing bookings from service duration
UPDATE bookings b
SET end_time = b.start_time + (s.duration_min || ' minutes')::interval
FROM services s
WHERE b.service_id = s.id AND b.end_time IS NULL;

-- =============================================================================
-- 3. SERVICES: ensure duration_min exists (already in schema.sql)
-- =============================================================================

ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_min integer DEFAULT 30;

-- =============================================================================
-- 4. REVIEWS: rating 1-5 (already added in 004)
-- =============================================================================

-- No changes needed; 004_add_reviews_rating.sql already adds rating

-- =============================================================================
-- 5. INDEXES for bookings
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_salon_start ON bookings(salon_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_status ON bookings(salon_id, status);

-- =============================================================================
-- 6. RLS: No public SELECT on bookings (owner reads via server route / service role)
-- =============================================================================

REVOKE SELECT ON bookings FROM anon;
REVOKE SELECT ON bookings FROM authenticated;

-- Insert remains via server route only (already revoked in 003)
-- Service role (supabaseAdmin) bypasses RLS for all operations
