-- Production-ready: bookings only via /api/bookings, no double booking
-- Run in Supabase SQL Editor

-- 5.1 Remove public bookings insert (insert only via server route)
DROP POLICY IF EXISTS "anon_insert_booking" ON bookings;
DROP POLICY IF EXISTS "authenticated_insert_booking" ON bookings;
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;
REVOKE INSERT ON bookings FROM anon;
REVOKE INSERT ON bookings FROM authenticated;

-- 5.2 Prevent double booking: same salon + time can't be booked twice
CREATE UNIQUE INDEX IF NOT EXISTS bookings_salon_time_unique ON bookings (salon_id, start_time);
