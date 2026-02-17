import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from "@/components/admin/AdminTable";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { EmptyStateTable } from "@/components/ui/EmptyState";

type Props = {
  searchParams: Promise<{ key?: string; salonSlug?: string; status?: string }>;
};

export default async function AdminBookingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key;
  const salonSlug = params.salonSlug?.trim();
  const statusFilter = params.status?.trim();

  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return <AdminLoginForm redirectPath="/admin/bookings" />;
  }

  let query = supabaseAdmin
    .from("bookings")
    .select("id, salon_id, service_id, customer_name, customer_phone, start_time, status, created_at")
    .order("start_time", { ascending: false })
    .limit(50);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  if (salonSlug) {
    const { data: salon } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("slug", salonSlug)
      .single();
    if (salon) {
      query = query.eq("salon_id", salon.id);
    }
  }

  const { data: bookings, error } = await query;

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load bookings"
        message="We couldn't load the bookings. Please try again or check your connection."
      />
    );
  }

  const salonIds = [...new Set((bookings ?? []).map((b) => b.salon_id))];
  const serviceIds = [...new Set((bookings ?? []).map((b) => b.service_id))];

  const { data: salons } = await supabaseAdmin
    .from("salons")
    .select("id, name, slug")
    .in("id", salonIds);

  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name")
    .in("id", serviceIds);

  const salonMap = new Map((salons ?? []).map((s) => [s.id, s]));
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const keyQ = key ? `?key=${encodeURIComponent(key)}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Bookings</h1>
        <p className="mt-1 text-sm text-stone-600">Latest 50 bookings</p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <input type="hidden" name="key" value={key ?? ""} />
        <div>
          <label htmlFor="salonSlug" className="block text-xs font-medium text-stone-600">
            Salon slug
          </label>
          <input
            id="salonSlug"
            name="salonSlug"
            type="text"
            defaultValue={salonSlug ?? ""}
            placeholder="e.g. kathmandu-cuts"
            className="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-stone-600">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? ""}
            className="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          >
            <option value="">All</option>
            <option value="confirmed">confirmed</option>
            <option value="cancelled">cancelled</option>
            <option value="completed">completed</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Filter
        </button>
      </form>

      <AdminTable>
        <AdminTableHeader>
          <AdminTableHeaderCell>Date/Time</AdminTableHeaderCell>
          <AdminTableHeaderCell>Salon</AdminTableHeaderCell>
          <AdminTableHeaderCell>Service</AdminTableHeaderCell>
          <AdminTableHeaderCell>Customer</AdminTableHeaderCell>
          <AdminTableHeaderCell>Phone</AdminTableHeaderCell>
          <AdminTableHeaderCell>Status</AdminTableHeaderCell>
          <AdminTableHeaderCell>Created at</AdminTableHeaderCell>
        </AdminTableHeader>
        <AdminTableBody>
          {(bookings ?? []).map((b) => (
            <AdminTableRow key={b.id}>
              <AdminTableCell className="whitespace-nowrap font-medium text-stone-900">
                {formatDate(b.start_time)}
              </AdminTableCell>
              <AdminTableCell>{salonMap.get(b.salon_id)?.name ?? "-"}</AdminTableCell>
              <AdminTableCell>{serviceMap.get(b.service_id)?.name ?? "-"}</AdminTableCell>
              <AdminTableCell className="font-medium">{b.customer_name}</AdminTableCell>
              <AdminTableCell>{b.customer_phone}</AdminTableCell>
              <AdminTableCell>
                <StatusBadge
                  status={b.status}
                  variant={
                    b.status === "confirmed"
                      ? "confirmed"
                      : b.status === "pending"
                        ? "pending"
                        : b.status === "cancelled"
                          ? "cancelled"
                          : "completed"
                  }
                />
              </AdminTableCell>
              <AdminTableCell className="whitespace-nowrap text-stone-500">
                {formatDate(b.created_at)}
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </AdminTable>

        {(bookings ?? []).length === 0 && (
          <EmptyStateTable
            title="No bookings found"
            description="Try adjusting your filters or check back later."
          />
        )}
    </div>
  );
}
