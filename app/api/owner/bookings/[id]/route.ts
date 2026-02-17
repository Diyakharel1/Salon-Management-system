import { NextRequest } from "next/server";
import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { BOOKING_STATUSES, isBookingStatus } from "@/types/booking";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const key = request.nextUrl.searchParams.get("key");
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return Response.json({ error: "Invalid or missing owner key" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = typeof body.status === "string" ? body.status.trim() : null;

  if (!status || !isBookingStatus(status)) {
    return Response.json(
      { error: `Invalid status. Use one of: ${BOOKING_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const { data: booking, error: fetchError } = await supabaseAdmin
    .from("bookings")
    .select("id, salon_id")
    .eq("id", id)
    .single();

  if (fetchError || !booking || booking.salon_id !== salon.id) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .eq("salon_id", salon.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ ok: true, status });
}
