import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";

export const dynamic = "force-dynamic";

const RATE_LIMIT_LIMIT = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60;

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  subject: z.string().optional().or(z.literal("")),
  message: z.string().min(5),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const key = `contact:${ip}`;

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
      { error: "Too many contact form submissions. Please wait a minute and try again." },
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

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      subject: parsed.subject || null,
      message: parsed.message,
      source: parsed.source || "website",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof z.ZodError
      ? e.issues.map((err: { message?: string }) => err.message ?? "").join("; ")
      : e instanceof Error
        ? e.message
        : "Invalid request";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
