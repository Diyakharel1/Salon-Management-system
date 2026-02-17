import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0+/, "").slice(-10);
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone")?.trim();
  if (!phone || phone.length < 7) {
    return NextResponse.json(
      { error: "Please provide a valid phone number." },
      { status: 400 }
    );
  }

  const normalized = normalizePhone(phone);
  if (normalized.length < 7) {
    return NextResponse.json(
      { error: "Phone number too short." },
      { status: 400 }
    );
  }

  // Fetch by exact phone, then by 98+phone (Nepal); merge and filter by normalized match
  const [res1, res2] = await Promise.all([
    supabaseAdmin
      .from("bookings")
      .select("id, start_time, status, customer_name, customer_phone, created_at, salon_id, service_id")
      .eq("customer_phone", normalized)
      .order("start_time", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("bookings")
      .select("id, start_time, status, customer_name, customer_phone, created_at, salon_id, service_id")
      .eq("customer_phone", "98" + normalized)
      .order("start_time", { ascending: false })
      .limit(100),
  ]);

  if (res1.error) {
    return NextResponse.json({ error: res1.error.message }, { status: 500 });
  }

  type Row = (typeof res1.data)[number];
  const byId = new Map<string, Row>();
  for (const b of res1.data ?? []) {
    byId.set(b.id, b);
  }
  for (const b of res2.data ?? []) {
    if (!byId.has(b.id)) byId.set(b.id, b);
  }
  let filtered = Array.from(byId.values())
    .filter((b) => normalizePhone(b.customer_phone ?? "") === normalized)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // Fallback: if no match, search recent bookings (handles stored formats like "98 6199 9146")
  if (filtered.length === 0) {
    const { data: fallback } = await supabaseAdmin
      .from("bookings")
      .select("id, start_time, status, customer_name, customer_phone, created_at, salon_id, service_id")
      .order("start_time", { ascending: false })
      .limit(500);
    filtered = (fallback ?? [])
      .filter((b) => normalizePhone(b.customer_phone ?? "") === normalized)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }

  const salonIds = [...new Set(filtered.map((b) => b.salon_id))];
  const serviceIds = [...new Set(filtered.map((b) => b.service_id))];

  const [salonsRes, servicesRes] = await Promise.all([
    salonIds.length > 0
      ? supabaseAdmin.from("salons").select("id, name, slug").in("id", salonIds)
      : { data: [] },
    serviceIds.length > 0
      ? supabaseAdmin.from("services").select("id, name").in("id", serviceIds)
      : { data: [] },
  ]);

  const salonMap = new Map((salonsRes.data ?? []).map((s) => [s.id, s]));
  const serviceMap = new Map((servicesRes.data ?? []).map((s) => [s.id, s]));

  const list = filtered.map((b) => ({
    id: b.id,
    start_time: b.start_time,
    status: b.status,
    customer_name: b.customer_name,
    created_at: b.created_at,
    salon_name: salonMap.get(b.salon_id)?.name ?? null,
    salon_slug: salonMap.get(b.salon_id)?.slug ?? null,
    service_name: serviceMap.get(b.service_id)?.name ?? null,
  }));

  return NextResponse.json({ bookings: list });
}
