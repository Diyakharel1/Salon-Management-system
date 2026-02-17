import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { OwnerLoginForm } from "@/components/owner/OwnerLoginForm";
import { OwnerServicesClient } from "@/components/owner/OwnerServicesClient";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/AdminTable";
import { OwnerEmptyState } from "@/components/owner/OwnerEmptyState";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

export default async function OwnerServicesPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key?.trim() || null;
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return <OwnerLoginForm redirectPath="/owner/services" />;
  }

  const { data: services, error } = await supabaseAdmin
    .from("services")
    .select("id, name, price, duration_min, is_active")
    .eq("salon_id", salon.id)
    .order("sort_order", { ascending: true })
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Services</h1>
          <p className="mt-1 text-sm text-stone-600">{salon.name}</p>
        </div>
        <OwnerServicesClient ownerKey={key!} mode="add" />
      </div>

      {error ? (
        <p className="text-red-600 text-sm">Failed to load services.</p>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableHeaderCell>Name</AdminTableHeaderCell>
            <AdminTableHeaderCell>Price (NPR)</AdminTableHeaderCell>
            <AdminTableHeaderCell>Duration</AdminTableHeaderCell>
            <AdminTableHeaderCell>Active</AdminTableHeaderCell>
            <AdminTableHeaderCell>Actions</AdminTableHeaderCell>
          </AdminTableHeader>
          <AdminTableBody>
            {(services ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <OwnerEmptyState
                    title="No services yet"
                    description="Add your first service (e.g. Haircut, Facial) so customers can book."
                    action={<span className="text-sm text-amber-600">Use the &quot;Add service&quot; button above.</span>}
                  />
                </td>
              </tr>
            ) : (
              (services ?? []).map((s) => (
                <AdminTableRow key={s.id}>
                  <AdminTableCell>{s.name}</AdminTableCell>
                  <AdminTableCell>NPR {(s.price ?? 0).toLocaleString()}</AdminTableCell>
                  <AdminTableCell>{s.duration_min ?? 0} min</AdminTableCell>
                  <AdminTableCell>{s.is_active ? "Yes" : "No"}</AdminTableCell>
                  <AdminTableCell>
                    <OwnerServicesClient ownerKey={key!} mode="edit" service={s} />
                    <OwnerServicesClient ownerKey={key!} mode="delete" service={s} />
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
