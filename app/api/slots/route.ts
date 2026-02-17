import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const SLOT_INTERVAL_MIN = 30;

/** Get offset in minutes (e.g. Asia/Kathmandu = 345 for +5:45). */
function getTimezoneOffsetMinutes(tz: string): number {
  const known: Record<string, number> = {
    "Asia/Kathmandu": 345,
    "UTC": 0,
  };
  return known[tz] ?? 0;
}

/** Parse "HH:MM", "HH:MM:SS", or ISO time to minutes since midnight */
function timeToMinutes(s: string | null | undefined): number {
  if (s == null || typeof s !== "string") return 0;
  let timeStr = s.trim();
  if (timeStr.includes("T")) timeStr = timeStr.split("T")[1] ?? timeStr;
  const parts = timeStr.split(":").map((p) => parseInt(p, 10));
  const h = Number.isFinite(parts[0]) ? parts[0]! : 0;
  const m = Number.isFinite(parts[1]) ? parts[1]! : 0;
  return h * 60 + m;
}

/** Build UTC Date for date (YYYY-MM-DD), minutes since midnight, and timezone offset (minutes) */
function localToUtc(dateStr: string, minutesSinceMidnight: number, offsetMinutes: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return new Date(NaN);
  const utcMinutes = minutesSinceMidnight - offsetMinutes;
  const day = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  return new Date(day.getTime() + utcMinutes * 60 * 1000);
}

/** Overlap: [aStart, aEnd) and [bStart, bEnd) */
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const salonSlug = searchParams.get("salonSlug")?.trim();
  const serviceId = searchParams.get("serviceId")?.trim();
  const date = searchParams.get("date")?.trim();

  if (!salonSlug || !serviceId || !date) {
    return NextResponse.json(
      { error: "Missing salonSlug, serviceId, or date (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  let normalizedDate = date;
  const ymdMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const mdyMatch = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ymdMatch) {
    normalizedDate = date;
  } else if (mdyMatch) {
    const [, mm, dd, yyyy] = mdyMatch;
    normalizedDate = `${yyyy}-${mm!.padStart(2, "0")}-${dd!.padStart(2, "0")}`;
  } else {
    return NextResponse.json({ error: "Invalid date; use YYYY-MM-DD" }, { status: 400 });
  }

  const { data: salon, error: salonError } = await supabaseAdmin
    .from("salons")
    .select("id, open_time, close_time, timezone")
    .eq("slug", salonSlug)
    .eq("is_active", true)
    .single();

  if (salonError || !salon) {
    return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  }

  const { data: service, error: serviceError } = await supabaseAdmin
    .from("services")
    .select("id, duration_min")
    .eq("id", serviceId)
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .single();

  if (serviceError || !service) {
    return NextResponse.json(
      { error: "Service not found or does not belong to this salon" },
      { status: 404 }
    );
  }

  const tz = (salon.timezone as string) || "Asia/Kathmandu";
  const openTime = salon.open_time != null ? String(salon.open_time) : "10:00";
  const closeTime = salon.close_time != null ? String(salon.close_time) : "20:00";
  const durationMin = (service.duration_min as number) ?? 30;

  let openMinutes = timeToMinutes(openTime);
  let closeMinutes = timeToMinutes(closeTime);
  if (!Number.isFinite(openMinutes) || openMinutes < 0) openMinutes = 9 * 60;
  if (!Number.isFinite(closeMinutes) || closeMinutes <= openMinutes) closeMinutes = openMinutes + 9 * 60;
  if (closeMinutes > 24 * 60) closeMinutes = 20 * 60;

  const offsetMin = getTimezoneOffsetMinutes(tz);

  const dayStartUtc = localToUtc(normalizedDate, openMinutes, offsetMin);
  const dayEndUtc = localToUtc(normalizedDate, closeMinutes, offsetMin);
  const dayStartUtcMs = dayStartUtc.getTime();
  const dayEndUtcMs = dayEndUtc.getTime();

  if (dayStartUtcMs >= dayEndUtcMs || Number.isNaN(dayStartUtcMs) || Number.isNaN(dayEndUtcMs)) {
    return NextResponse.json({ slots: [] });
  }

  const slotStarts: Date[] = [];
  for (let min = openMinutes; min + durationMin <= closeMinutes; min += SLOT_INTERVAL_MIN) {
    slotStarts.push(localToUtc(normalizedDate, min, offsetMin));
  }

  const dayBefore = new Date(dayStartUtcMs - 24 * 60 * 60 * 1000).toISOString();
  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("start_time, end_time, service_id")
    .eq("salon_id", salon.id)
    .in("status", ["pending", "confirmed", "completed"])
    .gte("start_time", dayBefore)
    .lt("start_time", dayEndUtc.toISOString());

  const { data: serviceRows } = await supabaseAdmin
    .from("services")
    .select("id, duration_min")
    .eq("salon_id", salon.id);
  const durationByServiceId = new Map<string, number>();
  for (const s of serviceRows ?? []) {
    durationByServiceId.set(s.id, (s.duration_min as number) ?? 30);
  }

  const blockedRanges: { start: Date; end: Date }[] = [];
  for (const b of bookings ?? []) {
    const start = new Date(b.start_time);
    const end = b.end_time
      ? new Date(b.end_time)
      : new Date(start.getTime() + (durationByServiceId.get(b.service_id) ?? 30) * 60 * 1000);
    if (end.getTime() > dayStartUtcMs) blockedRanges.push({ start, end });
  }

  const now = Date.now();
  const availableSlots = slotStarts
    .filter((slotStart) => {
      if (slotStart.getTime() < now) return false;
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);
      if (slotEnd.getTime() > dayEndUtcMs) return false;
      return !blockedRanges.some((r) =>
        overlaps(slotStart, slotEnd, r.start, r.end)
      );
    })
    .map((d) => d.toISOString());

  return NextResponse.json({ slots: availableSlots });
}
