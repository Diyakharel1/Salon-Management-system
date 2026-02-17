import { TableSkeleton } from "@/components/ui/Skeleton";

export default function OwnerServicesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-stone-200/80" />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}
