import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/AdminTable";
import { AdminSalonActions, type SalonRow } from "@/components/admin/AdminSalonActions";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { EmptyStateTable } from "@/components/ui/EmptyState";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

export default async function AdminSalonsPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key;

  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return <AdminLoginForm redirectPath="/admin/salons" />;
  }

  const { data: salons, error } = await supabaseAdmin
    .from("salons")
    .select("id, name, slug, city, address, phone, is_active, timezone, open_time, close_time, owner_key")
    .order("name");

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load salons"
        message={error.message}
      />
    );
  }

  const keyQ = key ? `?key=${encodeURIComponent(key)}` : "";

  const rows: SalonRow[] = (salons ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    city: s.city ?? null,
    address: s.address ?? null,
    phone: s.phone ?? null,
    is_active: s.is_active ?? true,
    timezone: (s as { timezone?: string | null }).timezone ?? null,
    open_time: (s as { open_time?: string | null }).open_time ?? null,
    close_time: (s as { close_time?: string | null }).close_time ?? null,
    owner_key: (s as { owner_key?: string | null }).owner_key ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Salons</h1>
        <p className="mt-1 text-sm text-stone-600">Edit or remove salons. Changes affect the public site and owner dashboard.</p>
      </div>

      <AdminTable>
        <AdminTableHeader>
          <AdminTableHeaderCell>Name</AdminTableHeaderCell>
          <AdminTableHeaderCell>Slug</AdminTableHeaderCell>
          <AdminTableHeaderCell>City</AdminTableHeaderCell>
          <AdminTableHeaderCell>Phone</AdminTableHeaderCell>
          <AdminTableHeaderCell>Active</AdminTableHeaderCell>
          <AdminTableHeaderCell>Owner key</AdminTableHeaderCell>
          <AdminTableHeaderCell>Actions</AdminTableHeaderCell>
        </AdminTableHeader>
        <AdminTableBody>
          {rows.map((salon) => (
            <AdminTableRow key={salon.id}>
              <AdminTableCell className="font-medium text-stone-900">{salon.name}</AdminTableCell>
              <AdminTableCell>
                <Link
                  href={`/salons/${salon.slug}`}
                  className="font-mono text-sm text-amber-700 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {salon.slug}
                </Link>
              </AdminTableCell>
              <AdminTableCell>{salon.city ?? "-"}</AdminTableCell>
              <AdminTableCell>{salon.phone ?? "-"}</AdminTableCell>
              <AdminTableCell>{salon.is_active ? "Yes" : "No"}</AdminTableCell>
              <AdminTableCell className="font-mono text-xs text-stone-500">
                {salon.owner_key ? `…${salon.owner_key.slice(-6)}` : "-"}
              </AdminTableCell>
              <AdminTableCell>
                <AdminSalonActions salon={salon} adminKey={key!} />
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </AdminTable>

      {rows.length === 0 && (
        <EmptyStateTable
          title="No salons"
          description="Run the seed API to create salons, or add them directly in the database."
        />
      )}
    </div>
  );
}
