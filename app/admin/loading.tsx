export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-40 animate-pulse rounded-lg bg-amber-200/40" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-amber-200/30" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-amber-200/40 bg-white/80"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-amber-200/40 bg-white/80" />
        <div className="h-72 animate-pulse rounded-2xl border border-amber-200/40 bg-white/80" />
      </div>
    </div>
  );
}
