import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (or your deployment env)"
    );
  }
  _client = createClient(url, anonKey);
  return _client;
}

// Lazy init so build/prerender succeeds when env vars are only set at runtime (e.g. in deployment).
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getClient() as Record<string | symbol, unknown>)[prop];
  },
});
