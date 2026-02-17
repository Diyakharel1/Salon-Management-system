import { supabaseAdmin } from "@/lib/supabaseServer";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { EmptyStateTable } from "@/components/ui/EmptyState";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/AdminTable";

type Props = {
  searchParams: Promise<{ key?: string; salonSlug?: string }>;
};

export default async function AdminSalesPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key;
  const salonSlug = params.salonSlug?.trim();

  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return <AdminLoginForm redirectPath="/admin/sales" />;
  }

  let query = supabaseAdmin
    .from("sales")
    .select("id, salon_id, total, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

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

  const { data: sales, error } = await query;

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load sales"
        message="We couldn't load the sales data. Please try again."
      />
    );
  }

  const salonIds = [...new Set((sales ?? []).map((s) => s.salon_id))];
  const saleIds = (sales ?? []).map((s) => s.id);

  const { data: salons } = await supabaseAdmin
    .from("salons")
    .select("id, name, slug")
    .in("id", salonIds);

  const { data: allItems } = await supabaseAdmin
    .from("sales_items")
    .select("sale_id, name, price")
    .in("sale_id", saleIds);

  const salonMap = new Map((salons ?? []).map((s) => [s.id, s]));
  const itemsBySale = new Map<string, { name: string; price: number | null }[]>();
  for (const item of allItems ?? []) {
    const list = itemsBySale.get(item.sale_id) ?? [];
    list.push({ name: item.name, price: item.price });
    itemsBySale.set(item.sale_id, list);
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const formatPrice = (cents: number | null) => (cents != null ? `NPR ${cents}` : "-");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Sales (OCR)</h1>
        <p className="mt-1 text-sm text-stone-600">
          Latest 50 sales from OCR bill uploads
        </p>
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
        <button
          type="submit"
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Filter
        </button>
      </form>

      <AdminTable>
        <AdminTableHeader>
          <AdminTableHeaderCell>Date</AdminTableHeaderCell>
          <AdminTableHeaderCell>Salon</AdminTableHeaderCell>
          <AdminTableHeaderCell>Total</AdminTableHeaderCell>
          <AdminTableHeaderCell>Items</AdminTableHeaderCell>
          <AdminTableHeaderCell>Sale ID</AdminTableHeaderCell>
        </AdminTableHeader>
        <AdminTableBody>
          {(sales ?? []).map((sale) => {
            const items = itemsBySale.get(sale.id) ?? [];
            const itemsSummary =
              items.length > 0
                ? items.map((i) => `${i.name} (${i.price ?? "-"})`).join(", ")
                : "-";
            return (
              <AdminTableRow key={sale.id}>
                <AdminTableCell className="whitespace-nowrap font-medium text-stone-900">
                  {formatDate(sale.created_at)}
                </AdminTableCell>
                <AdminTableCell>{salonMap.get(sale.salon_id)?.name ?? "-"}</AdminTableCell>
                <AdminTableCell className="font-medium">
                  {formatPrice(sale.total)}
                </AdminTableCell>
                <AdminTableCell
                  className="max-w-xs truncate text-stone-600"
                  title={itemsSummary}
                >
                  {itemsSummary}
                </AdminTableCell>
                <AdminTableCell className="font-mono text-xs text-stone-500">
                  {sale.id.slice(0, 8)}…
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </AdminTableBody>
      </AdminTable>

      {(sales ?? []).length === 0 && (
        <EmptyStateTable
          title="No sales found"
          description="Upload a bill via OCR to add sales data."
        />
      )}
    </div>
  );
}
