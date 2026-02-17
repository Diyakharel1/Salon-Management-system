import { TableSkeleton } from "@/components/ui/Skeleton";

export default function OwnerReviewsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-28 animate-pulse rounded-lg bg-stone-200/80" />
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
