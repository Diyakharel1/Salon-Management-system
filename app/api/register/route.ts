import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";

export const dynamic = "force-dynamic";

const RATE_LIMIT_LIMIT = 3;
const RATE_LIMIT_WINDOW_SECONDS = 300;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const Schema = z.object({
  salon_name: z.string().min(2, "Salon name must be at least 2 characters"),
  city: z.string().min(2, "City is required"),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().min(7, "Phone number is required"),
  owner_name: z.string().min(2, "Owner name is required"),
  owner_email: z.string().email("Valid email is required"),
  owner_phone: z.string().min(7, "Owner phone is required"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const key = `register:${ip}`;

  let rl;
  try {
    rl = await rateLimitOrThrow({
      key,
      limit: RATE_LIMIT_LIMIT,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    });
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return NextResponse.json(
      { error: "Rate limit unavailable. Please try again later." },
      { status: 503 }
    );
  }

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again in a few minutes." },
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
    const body = await req.json();
    const parsed = Schema.parse(body);

    const proposedSlug = slugify(parsed.salon_name);
    if (!proposedSlug) {
      return NextResponse.json(
        { error: "Salon name must contain at least one letter or number." },
        { status: 400 }
      );
    }

    const { data: existingSalon } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("slug", proposedSlug)
      .single();

    const { data: existingReg } = await supabaseAdmin
      .from("salon_registrations")
      .select("id")
      .eq("slug", proposedSlug)
      .eq("status", "pending")
      .single();

    let slug = proposedSlug;
    if (existingSalon || existingReg) {
      slug = `${proposedSlug}-${Date.now().toString(36).slice(-6)}`;
    }

    const { data, error } = await supabaseAdmin.from("salon_registrations").insert({
      salon_name: parsed.salon_name.trim(),
      slug,
      city: parsed.city.trim(),
      address: parsed.address?.trim() || null,
      phone: parsed.phone.trim(),
      owner_name: parsed.owner_name.trim(),
      owner_email: parsed.owner_email.trim(),
      owner_phone: parsed.owner_phone.trim(),
      notes: parsed.notes?.trim() || null,
      status: "pending",
    }).select("id").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      message: "Registration submitted. We'll review it and get back to you soon.",
    });
  } catch (e: unknown) {
    const message =
      e instanceof z.ZodError
        ? e.issues.map((err: { message?: string }) => err.message ?? "").join("; ")
        : e instanceof Error
          ? e.message
          : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
