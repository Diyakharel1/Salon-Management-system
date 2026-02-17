import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";

type Props = { params: Promise<{ id: string }> };

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("id, start_time, status, customer_name, customer_phone, created_at, salon_id, service_id")
    .eq("id", id)
    .single();

  if (error || !booking) notFound();

  const [{ data: salon }, { data: service }] = await Promise.all([
    supabaseAdmin.from("salons").select("id, name, slug, city, phone").eq("id", booking.salon_id).single(),
    supabaseAdmin.from("services").select("id, name, price, duration_min").eq("id", booking.service_id).single(),
  ]);

  const dateTime = new Date(booking.start_time).toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
  const statusLabel =
    booking.status === "confirmed"
      ? "Confirmed"
      : booking.status === "cancelled"
        ? "Cancelled"
        : "Completed";
  const statusColor =
    booking.status === "confirmed"
      ? "bg-emerald-100 text-emerald-800"
      : booking.status === "cancelled"
        ? "bg-red-100 text-red-800"
        : "bg-stone-100 text-stone-800";

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(n);
  const whatsappUrl =
    salon?.phone && salon.phone.replace(/\D/g, "").length >= 10
      ? `https://wa.me/977${salon.phone.replace(/\D/g, "").replace(/^0/, "")}`
      : null;

  return (
    <div className="mx-auto max-w-xl space-y-8 py-12">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Booking details</h1>
        <p className="mt-1 text-stone-600">Your appointment confirmation</p>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          <span className="font-mono text-xs text-stone-400">ID: {booking.id.slice(0, 8)}</span>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase text-stone-500">Date & time</p>
            <p className="mt-0.5 text-lg font-semibold text-stone-900">{dateTime}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-stone-500">Salon</p>
            <p className="mt-0.5 font-semibold text-stone-900">{salon?.name ?? "-"}</p>
            {salon?.city && <p className="text-sm text-stone-600">{salon.city}</p>}
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-stone-500">Service</p>
            <p className="mt-0.5 font-semibold text-stone-900">{service?.name ?? "-"}</p>
            {service && (
              <p className="text-sm text-stone-600">
                {formatPrice(service.price)} · {service.duration_min} min
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-stone-500">Booked for</p>
            <p className="mt-0.5 text-stone-900">{booking.customer_name}</p>
            <p className="text-sm text-stone-600">{booking.customer_phone}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {salon?.slug && (
            <Link
              href={`/salons/${salon.slug}`}
              className="inline-flex justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              View salon
            </Link>
          )}
          {whatsappUrl && (booking.status === "confirmed" || booking.status === "pending") && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-semibold text-white hover:bg-[#20bd5a]"
            >
              Message salon on WhatsApp
            </a>
          )}
          <Link
            href="/my-bookings"
            className="inline-flex justify-center text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            ← All my bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
