import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { OwnerLoginForm } from "@/components/owner/OwnerLoginForm";
import { OwnerBookingsClient, OwnerBookingActions } from "@/components/owner/OwnerBookingsClient";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from "@/components/admin/AdminTable";
import { OwnerEmptyState } from "@/components/owner/OwnerEmptyState";
import { isBookingStatus } from "@/types/booking";

type Props = {
  searchParams: Promise<{ key?: string; from?: string; to?: string; status?: string }>;
};

export default async function OwnerBookingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key?.trim() || null;
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return <OwnerLoginForm redirectPath="/owner/bookings" />;
  }

  const from = params.from?.trim();
  const to = params.to?.trim();
  const statusFilter = params.status?.trim();

  let query = supabaseAdmin
    .from("bookings")
    .select("id, service_id, customer_name, customer_phone, start_time, status, created_at")
    .eq("salon_id", salon.id)
    .order("start_time", { ascending: false })
    .limit(100);

  if (statusFilter && isBookingStatus(statusFilter)) {
    query = query.eq("status", statusFilter);
  }
  if (from) query = query.gte("start_time", from.includes("T") ? from : `${from}T00:00:00.000Z`);
  if (to) query = query.lte("start_time", to.includes("T") ? to : `${to}T23:59:59.999Z`);

  const { data: bookings, error } = await query;

  const serviceIds = [...new Set((bookings ?? []).map((b) => b.service_id))];
  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name")
    .in("id", serviceIds);
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const keyQ = key ? `?key=${encodeURIComponent(key)}` : "";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Bookings</h1>
        <p className="mt-1 text-sm text-stone-600">{salon.name}</p>
      </div>

      <OwnerBookingsClient ownerKey={key!} from={from} to={to} status={statusFilter} />

      {error ? (
        <p className="text-red-600 text-sm">Failed to load bookings.</p>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableHeaderCell>Date & time</AdminTableHeaderCell>
            <AdminTableHeaderCell>Service</AdminTableHeaderCell>
            <AdminTableHeaderCell>Customer</AdminTableHeaderCell>
            <AdminTableHeaderCell>Phone</AdminTableHeaderCell>
            <AdminTableHeaderCell>Status</AdminTableHeaderCell>
            <AdminTableHeaderCell>Actions</AdminTableHeaderCell>
          </AdminTableHeader>
          <AdminTableBody>
            {(bookings ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <OwnerEmptyState
                    title="No bookings"
                    description={
                      statusFilter || from || to
                        ? "No bookings match your filters. Try a different date range or status."
                        : "When customers book, they’ll appear here. Share your booking link with clients."
                    }
                  />
                </td>
              </tr>
            ) : (
              (bookings ?? []).map((b) => (
                <AdminTableRow key={b.id}>
                  <AdminTableCell>{formatDate(b.start_time)}</AdminTableCell>
                  <AdminTableCell>{serviceMap.get(b.service_id)?.name ?? "-"}</AdminTableCell>
                  <AdminTableCell>{b.customer_name}</AdminTableCell>
                  <AdminTableCell>{b.customer_phone}</AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge status={b.status} />
                  </AdminTableCell>
                  <AdminTableCell>
                    <OwnerBookingActions
                      bookingId={b.id}
                      currentStatus={b.status}
                      ownerKey={key!}
                    />
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTableBody>
        </AdminTable>
      )}
    </div>
  );
}
