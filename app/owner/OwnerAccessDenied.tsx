import Link from "next/link";

type Props = {
  demoKeys?: string[];
};

export function OwnerAccessDenied({ demoKeys }: Props) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">Access denied</h1>
        <p className="mt-2 text-stone-600">
          This page is for salon owners. Use a valid owner key in the URL:{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm">/owner?key=your_key</code>
        </p>
        <p className="mt-4 text-sm text-stone-500">
          If you don’t have a key, contact the platform to get one for your salon.
        </p>

        {demoKeys != null && demoKeys.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 text-left">
            <p className="text-sm font-semibold text-amber-900">Try demo</p>
            <p className="mt-1 text-sm text-amber-800">
              Add one of these keys to the URL to open the demo dashboard:
            </p>
            <ul className="mt-2 space-y-1">
              {demoKeys.map((k) => (
                <li key={k}>
                  <Link
                    href={`/owner?key=${encodeURIComponent(k.trim())}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    <code className="rounded bg-amber-100/80 px-2 py-0.5">{k.trim()}</code>
                    <span>→ Open demo</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
