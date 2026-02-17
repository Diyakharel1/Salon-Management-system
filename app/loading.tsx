export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-100" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-6">
          <div className="h-11 w-full animate-pulse rounded-lg bg-zinc-200" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-lg border border-zinc-200 bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
