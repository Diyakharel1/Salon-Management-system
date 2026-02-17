import { supabaseAdmin } from "@/lib/supabaseServer";

export type SalonRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
};

/** Validate owner key and return salon or null. Use in API routes and server components. */
export async function getSalonByOwnerKey(key: string | null): Promise<SalonRow | null> {
  if (!key || typeof key !== "string" || !key.trim()) return null;
  const { data, error } = await supabaseAdmin
    .from("salons")
    .select("id, name, slug, city, address, phone, is_active")
    .eq("owner_key", key.trim())
    .maybeSingle();
  if (error || !data) return null;
  return data as SalonRow;
}
