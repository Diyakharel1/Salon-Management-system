import { NextResponse } from "next/server";
import { headers } from "next/headers";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  const headerSecret = (await headers()).get("x-admin-key");
  const urlKey = new URL(request.url).searchParams.get("key");

  if (!secret || (headerSecret !== secret && urlKey !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing registration id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action as string;
  const adminNotes = body.admin_notes as string | undefined;

  if (action === "approve") {
    const { data: reg, error: fetchErr } = await supabaseAdmin
      .from("salon_registrations")
      .select("*")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (fetchErr || !reg) {
      return NextResponse.json(
        { error: "Registration not found or already reviewed" },
        { status: 404 }
      );
    }

    let slug = reg.slug;
    const { data: existing } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-6)}`;
    }

    const ownerKey = generateOwnerKey();

    const { data: salon, error: salonErr } = await supabaseAdmin
      .from("salons")
      .insert({
        name: reg.salon_name,
        slug,
        city: reg.city,
        address: reg.address,
        phone: reg.phone,
        is_active: true,
        owner_key: ownerKey,
      })
      .select("id")
      .single();

    if (salonErr) {
      return NextResponse.json({ error: salonErr.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("services")
      .insert({
        salon_id: salon.id,
        name: "General Service",
        price: 500,
        duration_min: 30,
        sort_order: 0,
      });

    await supabaseAdmin
      .from("salon_registrations")
      .update({
        status: "approved",
        admin_notes: adminNotes ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      ok: true,
      salon_id: salon.id,
      slug,
      owner_key: ownerKey,
      message: "Salon approved. Share the owner key with the applicant.",
    });
  }

  if (action === "reject") {
    const { data: reg, error: fetchErr } = await supabaseAdmin
      .from("salon_registrations")
      .select("id")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (fetchErr || !reg) {
      return NextResponse.json(
        { error: "Registration not found or already reviewed" },
        { status: 404 }
      );
    }

    await supabaseAdmin
      .from("salon_registrations")
      .update({
        status: "rejected",
        admin_notes: adminNotes ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ ok: true, message: "Registration rejected." });
  }

  return NextResponse.json(
    { error: "Invalid action. Use approve or reject." },
    { status: 400 }
  );
}
