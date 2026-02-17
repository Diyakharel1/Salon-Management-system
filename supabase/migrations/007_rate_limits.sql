-- Production rate limiting (multi-instance safe, survives restarts)
CREATE TABLE IF NOT EXISTS rate_limits (
  key text PRIMARY KEY,
  count int NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL
);

COMMENT ON TABLE rate_limits IS 'Rate limit counters per key (e.g. bookings:1.2.3.4)';

CREATE OR REPLACE FUNCTION rate_limit_check(
  p_key text,
  p_limit int,
  p_window_seconds int
)
RETURNS TABLE (allowed boolean, remaining int, reset_at timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now timestamptz := now();
  v_count int;
  v_reset_at timestamptz;
BEGIN
  INSERT INTO rate_limits (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limits.reset_at < v_now THEN 1
      ELSE rate_limits.count + 1
    END,
    reset_at = CASE
      WHEN rate_limits.reset_at < v_now THEN v_now + (p_window_seconds || ' seconds')::interval
      ELSE rate_limits.reset_at
    END
  RETURNING rate_limits.count, rate_limits.reset_at INTO v_count, v_reset_at;

  allowed := v_count <= p_limit;
  remaining := greatest(0, p_limit - v_count);
  reset_at := v_reset_at;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION rate_limit_check IS 'Increment and check rate limit; returns allowed, remaining, reset_at';
