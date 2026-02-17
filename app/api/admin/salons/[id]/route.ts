import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function requireAdminKey(request: NextRequest): { ok: true } | { ok: false; status: number; error: string } {
  const key = request.nextUrl.searchParams.get("key");
  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return { ok: false, status: 401, error: "Invalid or missing admin key" };
  }
  return { ok: true };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminKey(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates: {
    name?: string;
    slug?: string;
    city?: string;
    address?: string | null;
    phone?: string | null;
    is_active?: boolean;
    timezone?: string;
    open_time?: string;
    close_time?: string;
  } = {};

  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.slug === "string") updates.slug = body.slug.trim().toLowerCase().replace(/\s+/g, "-");
  if (typeof body.city === "string") updates.city = body.city.trim();
  if (body.address !== undefined) updates.address = body.address === "" || body.address == null ? null : String(body.address).trim();
  if (body.phone !== undefined) updates.phone = body.phone === "" || body.phone == null ? null : String(body.phone).trim();
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
  if (typeof body.timezone === "string") updates.timezone = body.timezone.trim() || "Asia/Kathmandu";
  if (typeof body.open_time === "string") updates.open_time = body.open_time.trim();
  if (typeof body.close_time === "string") updates.close_time = body.close_time.trim();

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }
  if (updates.name !== undefined && !updates.name) {
    return Response.json({ error: "Name cannot be empty" }, { status: 400 });
  }
  if (updates.slug !== undefined && !updates.slug) {
    return Response.json({ error: "Slug cannot be empty" }, { status: 400 });
  }
  if (updates.city !== undefined && !updates.city) {
    return Response.json({ error: "City cannot be empty" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("salons")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) {
    return Response.json({ error: "Salon not found" }, { status: 404 });
  }

  if (updates.slug !== undefined) {
    const { data: slugConflict } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("slug", updates.slug)
      .neq("id", id)
      .maybeSingle();
    if (slugConflict) {
      return Response.json({ error: "Another salon already uses this slug" }, { status: 400 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("salons")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ salon: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminKey(request);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const { data: existing } = await supabaseAdmin
    .from("salons")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) {
    return Response.json({ error: "Salon not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin.from("salons").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return Response.json(
        { error: "Cannot delete salon: it has bookings or other linked data. Deactivate it instead." },
        { status: 409 }
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
