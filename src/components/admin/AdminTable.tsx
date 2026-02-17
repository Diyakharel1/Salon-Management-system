"use client";

type AdminTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminTable({ children, className = "" }: AdminTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-stone-200 bg-white shadow-md ${className}`}
    >
      <div className="overflow-auto max-h-[70vh]">
        <table className="min-w-full">
          {children}
        </table>
      </div>
    </div>
  );
}

export function AdminTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-stone-100">
      <tr>{children}</tr>
    </thead>
  );
}

export function AdminTableHeaderCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-600 ${className}`}
    >
      {children}
    </th>
  );
}

export function AdminTableBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-stone-200">
      {children}
    </tbody>
  );
}

export function AdminTableRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={`text-sm transition-colors hover:bg-stone-50 even:bg-stone-50/50 ${className}`}>
      {children}
    </tr>
  );
}

export function AdminTableCell({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <td title={title} className={`px-4 py-3 text-stone-700 ${className}`}>
      {children}
    </td>
  );
}

export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "confirmed" | "cancelled" | "completed" | "pending" | "positive" | "negative" | "neutral" | "default";
}) {
  const styles: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    completed: "bg-stone-100 text-stone-700",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-stone-200 text-stone-700",
    positive: "bg-emerald-100 text-emerald-800",
    negative: "bg-red-100 text-red-800",
    neutral: "bg-amber-100 text-amber-800",
    default: "bg-stone-100 text-stone-700",
  };
  const style = styles[variant] ?? styles[status.toLowerCase()] ?? styles.default;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}
