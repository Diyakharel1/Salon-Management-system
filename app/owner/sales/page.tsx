import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { OwnerLoginForm } from "@/components/owner/OwnerLoginForm";
import { OwnerEmptyState } from "@/components/owner/OwnerEmptyState";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/AdminTable";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

export default async function OwnerSalesPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key?.trim() || null;
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return <OwnerLoginForm redirectPath="/owner/sales" />;
  }

  const { data: sales, error } = await supabaseAdmin
    .from("sales")
    .select("id, total, raw_text, created_at")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Sales</h1>
        <p className="mt-1 text-sm text-stone-600">OCR-recorded sales for {salon.name}</p>
      </div>

      {error ? (
        <p className="text-red-600 text-sm">Failed to load sales.</p>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableHeaderCell>Date</AdminTableHeaderCell>
            <AdminTableHeaderCell>Total (NPR)</AdminTableHeaderCell>
            <AdminTableHeaderCell>Raw text</AdminTableHeaderCell>
          </AdminTableHeader>
          <AdminTableBody>
            {(sales ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="p-0">
                  <OwnerEmptyState
                    title="No sales recorded"
                    description="Upload bills via OCR to record sales. Sales will appear here."
                  />
                </td>
              </tr>
            ) : (
              (sales ?? []).map((s) => (
                <AdminTableRow key={s.id}>
                  <AdminTableCell>{formatDate(s.created_at)}</AdminTableCell>
                  <AdminTableCell>NPR {(s.total ?? 0).toLocaleString()}</AdminTableCell>
                  <AdminTableCell className="max-w-xs truncate" title={s.raw_text ?? ""}>
                    {s.raw_text ? (
                      <span className="line-clamp-2">{s.raw_text}</span>
                    ) : (
                      "-"
                    )}
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
