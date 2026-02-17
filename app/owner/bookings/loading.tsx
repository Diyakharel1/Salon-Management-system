import { TableSkeleton } from "@/components/ui/Skeleton";

export default function OwnerBookingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-stone-200/80" />
      <div className="h-24 animate-pulse rounded-2xl bg-stone-100/80" />
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
