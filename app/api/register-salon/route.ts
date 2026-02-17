import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function generateOwnerKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let key = "";
  for (let i = 0; i < 24; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "salon";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const slugInput = typeof body.slug === "string" ? body.slug.trim().toLowerCase().replace(/\s+/g, "-") : "";
    const address = body.address != null ? String(body.address).trim() || null : null;
    const phone = body.phone != null ? String(body.phone).trim() || null : null;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Salon name is required (at least 2 characters)" }, { status: 400 });
    }
    if (!city || city.length < 2) {
      return NextResponse.json({ error: "City is required (at least 2 characters)" }, { status: 400 });
    }

    let slug = slugInput || nameToSlug(name);
    if (slug.length < 2) slug = "salon";

    const { data: existing } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      let uniqueSlug = slug;
      let n = 1;
      while (true) {
        const { data: again } = await supabaseAdmin.from("salons").select("id").eq("slug", uniqueSlug).maybeSingle();
        if (!again) break;
        uniqueSlug = `${slug}-${n}`;
        n++;
      }
      slug = uniqueSlug;
    }

    const owner_key = generateOwnerKey();

    const insert: {
      name: string;
      slug: string;
      city: string;
      address: string | null;
      phone: string | null;
      owner_key: string;
    } = {
      name,
      slug,
      city,
      address,
      phone,
      owner_key,
    };

    const { data: salon, error } = await supabaseAdmin
      .from("salons")
      .insert(insert)
      .select("id, name, slug, owner_key")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This salon URL is already taken. Try a different name or slug." }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (request.headers.get("x-forwarded-proto") && request.headers.get("host") ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}` : "");
    const ownerUrl = baseUrl ? `${baseUrl}/owner?key=${encodeURIComponent(salon.owner_key)}` : `/owner?key=${encodeURIComponent(salon.owner_key)}`;

    return NextResponse.json({
      ok: true,
      salon_id: salon.id,
      name: salon.name,
      slug: salon.slug,
      owner_key: salon.owner_key,
      owner_url: ownerUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed" },
      { status: 500 }
    );
  }
}
