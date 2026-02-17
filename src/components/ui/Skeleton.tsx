"use client";

function Shimmer() {
  return (
    <div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
      style={{ animation: "shimmer 2s infinite" }}
      aria-hidden
    />
  );
}

export function SalonCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-lg shadow-stone-200/50">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200">
        <Shimmer />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-5 w-3/4 rounded-lg bg-stone-200/80" />
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded bg-stone-200/60" />
          <div className="h-4 w-20 rounded bg-stone-200/60" />
        </div>
        <div className="mt-2 h-4 w-24 rounded bg-amber-100/80" />
      </div>
    </div>
  );
}

export function SalonPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-gradient-to-br from-stone-200 to-stone-300">
        <Shimmer />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-8 w-40 rounded bg-stone-200" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative h-32 overflow-hidden rounded-2xl bg-stone-200">
              <Shimmer />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="relative h-40 overflow-hidden rounded-2xl bg-stone-200">
            <Shimmer />
          </div>
          <div className="relative h-48 overflow-hidden rounded-2xl bg-stone-200">
            <Shimmer />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5">
      <Shimmer />
      <div className="space-y-3">
        <div className="h-5 w-2/3 rounded bg-stone-200" />
        <div className="h-4 w-24 rounded bg-stone-200/80" />
        <div className="h-10 w-20 rounded-xl bg-stone-200" />
      </div>
    </div>
  );
}

export function BookingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-48 rounded bg-stone-200" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-stone-200">
            <Shimmer />
          </div>
          <div className="space-y-3 rounded-b-2xl border border-t-0 border-stone-200 bg-white p-6">
            <div className="h-4 w-24 rounded bg-stone-200" />
            <div className="h-5 w-full rounded bg-stone-200" />
            <div className="h-4 w-32 rounded bg-stone-200" />
          </div>
        </div>
        <div className="space-y-4 lg:col-span-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-stone-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-100">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <div className="h-4 w-20 rounded bg-stone-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {Array.from({ length: rows }).map((_, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-stone-50/50"}>
                {Array.from({ length: cols }).map((_, ci) => (
                  <td key={ci} className="px-4 py-3">
                    <div className="h-4 w-full max-w-32 rounded bg-stone-200/80" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
