import { supabaseAdmin } from "@/lib/supabaseServer";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
};

/**
 * Check and increment rate limit in Supabase (multi-instance safe).
 * Throws if the RPC fails.
 *
 * Use in API routes that should be rate-limited: import and call rateLimitOrThrow
 * at the start of the handler (e.g. POST /api/bookings, /api/contact, /api/ai/ocr-bill).
 * Requires Supabase RPC "rate_limit_check" to exist.
 */
export async function rateLimitOrThrow(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc("rate_limit_check", {
    p_key: opts.key,
    p_limit: opts.limit,
    p_window_seconds: opts.windowSeconds,
  });

  if (error) throw new Error(`rate_limit_check failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("rate_limit_check returned empty");

  return {
    allowed: row.allowed as boolean,
    remaining: row.remaining as number,
    resetAt: row.reset_at as string,
  };
}
