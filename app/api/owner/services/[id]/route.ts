import { NextRequest } from "next/server";
import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates: { name?: string; price?: number; duration_min?: number; is_active?: boolean } = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.price === "number") updates.price = body.price;
  else if (body.price !== undefined) updates.price = parseInt(String(body.price), 10);
  if (typeof body.duration_min === "number") updates.duration_min = body.duration_min;
  else if (body.duration_min !== undefined) updates.duration_min = parseInt(String(body.duration_min), 10);
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }
  if (updates.name !== undefined && !updates.name) {
    return Response.json({ error: "name cannot be empty" }, { status: 400 });
  }
  if (updates.price !== undefined && (!Number.isFinite(updates.price) || updates.price < 0)) {
    return Response.json({ error: "price must be non-negative" }, { status: 400 });
  }
  if (updates.duration_min !== undefined && (!Number.isInteger(updates.duration_min) || updates.duration_min < 1)) {
    return Response.json({ error: "duration_min must be a positive integer" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("services")
    .select("id")
    .eq("id", id)
    .eq("salon_id", salon.id)
    .single();

  if (!existing) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("services")
    .update(updates)
    .eq("id", id)
    .eq("salon_id", salon.id)
    .select("id, name, price, duration_min, is_active, sort_order, created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ service: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const { id } = await params;

  const { data: existing } = await supabaseAdmin
    .from("services")
    .select("id")
    .eq("id", id)
    .eq("salon_id", salon.id)
    .single();

  if (!existing) {
    return Response.json({ error: "Service not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("services")
    .delete()
    .eq("id", id)
    .eq("salon_id", salon.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
