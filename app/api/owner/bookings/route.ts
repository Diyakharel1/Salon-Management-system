import { NextRequest } from "next/server";
import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const status = request.nextUrl.searchParams.get("status");

  let query = supabaseAdmin
    .from("bookings")
    .select("id, salon_id, service_id, customer_name, customer_phone, customer_email, start_time, status, notes, created_at")
    .eq("salon_id", salon.id)
    .order("start_time", { ascending: false })
    .limit(100);

  const validStatuses = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;
  if (status && validStatuses.includes(status as (typeof validStatuses)[number])) {
    query = query.eq("status", status);
  }
  if (from) {
    query = query.gte("start_time", from);
  }
  if (to) {
    query = query.lte("start_time", to);
  }

  const { data: bookings, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const serviceIds = [...new Set((bookings ?? []).map((b) => b.service_id))];
  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name")
    .in("id", serviceIds);
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const list = (bookings ?? []).map((b) => ({
    ...b,
    service_name: serviceMap.get(b.service_id)?.name ?? null,
  }));

  return Response.json({ bookings: list });
}
