import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ownerKey: string }> }
) {
  const { ownerKey } = await params;
  if (!ownerKey) {
    return NextResponse.json({ error: "Missing owner key" }, { status: 400 });
  }

  const { data: salon, error: salonError } = await supabaseAdmin
    .from("salons")
    .select("id")
    .eq("owner_key", ownerKey)
    .single();

  if (salonError || !salon) {
    return NextResponse.json({ error: "Salon not found or invalid owner key" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim();
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

  let query = supabaseAdmin
    .from("bookings")
    .select("id, salon_id, service_id, customer_name, customer_phone, customer_email, start_time, end_time, status, notes, created_at")
    .eq("salon_id", salon.id)
    .order("start_time", { ascending: false })
    .limit(limit);

  if (status && ["pending", "confirmed", "completed", "cancelled", "no_show"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data: bookings, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const serviceIds = [...new Set((bookings ?? []).map((b) => b.service_id))];
  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_min")
    .in("id", serviceIds);
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const list = (bookings ?? []).map((b) => ({
    ...b,
    service: serviceMap.get(b.service_id) ?? null,
  }));

  return NextResponse.json({ bookings: list });
}
