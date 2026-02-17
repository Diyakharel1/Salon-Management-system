import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";

export const dynamic = "force-dynamic";

const RATE_LIMIT_LIMIT = 8;
const RATE_LIMIT_WINDOW_SECONDS = 60;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const key = `bookings:${ip}`;

  let rl: { allowed: boolean; remaining: number; resetAt: string } | null = null;
  try {
    rl = await rateLimitOrThrow({
      key,
      limit: RATE_LIMIT_LIMIT,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    });
  } catch (err) {
    console.warn("Rate limit check failed (booking allowed):", err);
    // Proceed without rate limiting so bookings work if migration 007_rate_limits.sql wasn't run
  }

  if (rl && !rl.allowed) {
    return NextResponse.json(
      { error: "Too many booking requests. Please wait a minute and try again." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT_LIMIT),
          "X-RateLimit-Remaining": String(rl.remaining),
          "X-RateLimit-Reset": rl.resetAt,
        },
      }
    );
  }

  try {
    const body = await request.json();
    const {
      salon_id,
      service_id,
      customer_name,
      customer_phone,
      customer_email,
      notes,
      start_time,
    } = body;

    if (!salon_id || !service_id || !customer_name || !customer_phone || !start_time) {
      return NextResponse.json(
        { error: "Missing required fields: salon_id, service_id, customer_name, customer_phone, start_time" },
        { status: 400 }
      );
    }

    const { data: salon, error: salonError } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("id", salon_id)
      .eq("is_active", true)
      .single();

    if (salonError || !salon) {
      return NextResponse.json({ error: "Salon not found or inactive" }, { status: 400 });
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("id, duration_min")
      .eq("id", service_id)
      .eq("salon_id", salon_id)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Service not found or does not belong to salon" },
        { status: 400 }
      );
    }

    const durationMin = service.duration_min ?? 30;
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
    const end_time = endDate.toISOString();

    const dayBefore = new Date(startDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from("bookings")
      .select("id, start_time, end_time, service_id")
      .eq("salon_id", salon_id)
      .in("status", ["pending", "confirmed"])
      .lt("start_time", endDate.toISOString())
      .gte("start_time", dayBefore);

    const { data: serviceRows } = await supabaseAdmin
      .from("services")
      .select("id, duration_min")
      .eq("salon_id", salon_id);
    const durationByServiceId = new Map<string, number>();
    for (const s of serviceRows ?? []) {
      durationByServiceId.set(s.id, (s.duration_min as number) ?? 30);
    }

    const ourStart = startDate.getTime();
    const ourEnd = endDate.getTime();
    const overlaps = (existing ?? []).some((b) => {
      const bStart = new Date(b.start_time).getTime();
      const bEnd = b.end_time
        ? new Date(b.end_time).getTime()
        : bStart + (durationByServiceId.get(b.service_id) ?? 30) * 60 * 1000;
      return ourStart < bEnd && ourEnd > bStart;
    });

    if (overlaps) {
      return NextResponse.json(
        { error: "This time slot overlaps with an existing booking. Please choose another time." },
        { status: 409 }
      );
    }

    const { data: booking, error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert({
        salon_id,
        service_id,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        notes: notes || null,
        start_time,
        end_time,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This time slot is already booked. Please choose another time." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: booking.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
