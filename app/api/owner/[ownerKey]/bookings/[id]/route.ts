import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ownerKey: string; id: string }> }
) {
  const { ownerKey, id } = await params;
  if (!ownerKey || !id) {
    return NextResponse.json({ error: "Missing owner key or booking id" }, { status: 400 });
  }

  const { data: salon, error: salonError } = await supabaseAdmin
    .from("salons")
    .select("id")
    .eq("owner_key", ownerKey)
    .single();

  if (salonError || !salon) {
    return NextResponse.json({ error: "Salon not found or invalid owner key" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const status = body.status?.trim();

  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const { data: booking, error: fetchError } = await supabaseAdmin
    .from("bookings")
    .select("id, salon_id")
    .eq("id", id)
    .eq("salon_id", salon.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found or does not belong to this salon" }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .eq("salon_id", salon.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ id, status });
}
