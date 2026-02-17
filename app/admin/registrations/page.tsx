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
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { EmptyStateTable } from "@/components/ui/EmptyState";
import { RegistrationActions } from "./RegistrationActions";

type Props = {
  searchParams: Promise<{ key?: string; status?: string }>;
};

export default async function AdminRegistrationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key;
  const statusFilter = params.status?.trim();

  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return <AdminLoginForm redirectPath="/admin/registrations" />;
  }

  let query = supabaseAdmin
    .from("salon_registrations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data: registrations, error } = await query;

  if (error) {
    return (
      <ErrorAlert
        title="Failed to load registrations"
        message={error.message}
      />
    );
  }

  const keyQ = key ? `?key=${encodeURIComponent(key)}` : "";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const pendingCount = (registrations ?? []).filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Salon registrations</h1>
          <p className="mt-1 text-sm text-stone-600">
            Review and approve or reject new salon sign-ups. Approved salons get an owner key to access the portal.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            {pendingCount} pending
          </span>
        )}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="key" value={key ?? ""} />
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
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
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
          <AdminTableHeaderCell>Salon</AdminTableHeaderCell>
          <AdminTableHeaderCell>Owner</AdminTableHeaderCell>
          <AdminTableHeaderCell>Contact</AdminTableHeaderCell>
          <AdminTableHeaderCell>Status</AdminTableHeaderCell>
          <AdminTableHeaderCell>Submitted</AdminTableHeaderCell>
          <AdminTableHeaderCell>Actions</AdminTableHeaderCell>
        </AdminTableHeader>
        <AdminTableBody>
          {(registrations ?? []).map((r) => (
            <AdminTableRow key={r.id}>
              <AdminTableCell>
                <div>
                  <p className="font-medium text-stone-900">{r.salon_name}</p>
                  <p className="text-xs text-stone-500">{r.slug} · {r.city}</p>
                </div>
              </AdminTableCell>
              <AdminTableCell>
                <p className="font-medium text-stone-900">{r.owner_name}</p>
              </AdminTableCell>
              <AdminTableCell>
                <p className="text-sm">{r.owner_email}</p>
                <p className="text-xs text-stone-500">{r.owner_phone}</p>
              </AdminTableCell>
              <AdminTableCell>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : r.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {r.status}
                </span>
              </AdminTableCell>
              <AdminTableCell className="whitespace-nowrap text-stone-500">
                {formatDate(r.created_at)}
              </AdminTableCell>
              <AdminTableCell>
                <RegistrationActions
                  registration={r}
                  adminKey={key!}
                />
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </AdminTable>

      {(registrations ?? []).length === 0 && (
        <EmptyStateTable
          title="No registrations"
          description={
            statusFilter
              ? "No registrations match this filter."
              : "Salon owners can register at /register. Pending applications will appear here."
          }
        />
      )}
    </div>
  );
}
