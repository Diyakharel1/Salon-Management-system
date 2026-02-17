import { NextRequest } from "next/server";
import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_min, is_active, sort_order, created_at")
    .eq("salon_id", salon.id)
    .order("sort_order", { ascending: true })
    .order("name");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ services: data ?? [] });
}

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = typeof body.price === "number" ? body.price : parseInt(String(body.price), 10);
  const duration_min = typeof body.duration_min === "number"
    ? body.duration_min
    : parseInt(String(body.duration_min ?? 30), 10);
  const is_active = body.is_active !== false;

  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return Response.json({ error: "price must be a non-negative number" }, { status: 400 });
  }
  if (!Number.isInteger(duration_min) || duration_min < 1) {
    return Response.json({ error: "duration_min must be a positive integer" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("services")
    .insert({
      salon_id: salon.id,
      name,
      price,
      duration_min,
      is_active,
    })
    .select("id, name, price, duration_min, is_active, sort_order, created_at")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ service: data });
}
