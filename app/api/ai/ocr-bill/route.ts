import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { rateLimitOrThrow } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";

export const dynamic = "force-dynamic";

const RATE_LIMIT_LIMIT = 3;
const RATE_LIMIT_WINDOW_SECONDS = 60;

export async function POST(request: Request) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    const headerKey = request.headers.get("x-admin-key");

    if (!adminSecret || headerKey !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const key = `ocr-bill:${ip}`;

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
        { error: "Too many OCR uploads. Please wait a minute and try again." },
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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const salonSlug = formData.get("salonSlug")?.toString()?.trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing or invalid file (expected multipart field: file)" },
        { status: 400 }
      );
    }

    if (!salonSlug) {
      return NextResponse.json(
        { error: "Missing salonSlug" },
        { status: 400 }
      );
    }

    const { data: salon, error: salonError } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("slug", salonSlug)
      .eq("is_active", true)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: "Salon not found or inactive" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL?.replace(/\/$/, "");
    if (!baseUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_AI_BASE_URL is not configured" },
        { status: 500 }
      );
    }
    const ocrUrl = `${baseUrl}/api/ocr/bill`;
    const aiFormData = new FormData();
    aiFormData.append("file", file);

    let ocrResponse: Response;
    try {
      ocrResponse = await fetch(ocrUrl, {
        method: "POST",
        body: aiFormData,
      });
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to reach AI backend: ${err instanceof Error ? err.message : "Unknown error"}` },
        { status: 502 }
      );
    }

    let ocrJson: {
      raw_text?: string;
      services?: { name: string; price: number }[];
      total_price?: number | null;
      date?: string;
      success?: boolean;
      message?: string;
      detail?: string;
    };

    try {
      ocrJson = await ocrResponse.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid response from AI backend" },
        { status: 502 }
      );
    }

    if (!ocrResponse.ok) {
      const errMsg =
        ocrJson.detail ?? ocrJson.message ?? ocrResponse.statusText ?? "OCR request failed";
      return NextResponse.json(
        { error: errMsg },
        { status: ocrResponse.status >= 500 ? 502 : 400 }
      );
    }

    if (ocrJson.success === false) {
      return NextResponse.json(
        { error: ocrJson.message ?? "OCR processing failed" },
        { status: 400 }
      );
    }

    const rawText = ocrJson.raw_text ?? "";
    const services = ocrJson.services ?? [];
    const totalPrice = ocrJson.total_price != null ? Math.round(ocrJson.total_price) : null;

    const { data: sale, error: saleError } = await supabaseAdmin
      .from("sales")
      .insert({
        salon_id: salon.id,
        total: totalPrice,
        raw_text: rawText || null,
      })
      .select("id")
      .single();

    if (saleError) {
      return NextResponse.json(
        { error: saleError.message },
        { status: 500 }
      );
    }

    if (services.length > 0) {
      const items = services.map((s) => ({
        sale_id: sale.id,
        name: s.name,
        price: s.price != null ? Math.round(s.price) : null,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("sales_items")
        .insert(items);

      if (itemsError) {
        return NextResponse.json(
          { error: itemsError.message },
          { status: 500 }
        );
      }
    }

    const servicesOut = services.map((s) => ({
      name: s.name,
      price: s.price != null ? Math.round(s.price) : null,
    }));

    return NextResponse.json({
      sale_id: sale.id,
      total_price: totalPrice,
      services: servicesOut,
      raw_text: rawText,
    });
  } catch (err) {
    console.error("OCR bill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
