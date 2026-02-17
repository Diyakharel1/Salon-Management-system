import { NextRequest } from "next/server";
import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }
  return Response.json({ salon });
}

/** Owner can update their salon's name, city, address, phone (not slug or owner_key). */
export async function PATCH(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const updates: { name?: string; city?: string; address?: string; phone?: string } = {};
  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) return Response.json({ error: "Name is required" }, { status: 400 });
    updates.name = v;
  }
  if (body.city !== undefined) updates.city = typeof body.city === "string" ? body.city.trim() || null : null;
  if (body.address !== undefined) updates.address = typeof body.address === "string" ? body.address.trim() || null : null;
  if (body.phone !== undefined) updates.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;

  if (Object.keys(updates).length === 0) {
    return Response.json({ salon }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from("salons")
    .update(updates)
    .eq("id", salon.id)
    .select("id, name, slug, city, address, phone, is_active")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ salon: data });
}
