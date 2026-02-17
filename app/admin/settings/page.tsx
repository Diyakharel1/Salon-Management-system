import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

export default async function AdminSettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key;

  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return <AdminLoginForm redirectPath="/admin/settings" />;
  }

  const feedbackDays = Math.max(
    1,
    Math.min(365, parseInt(process.env.ADMIN_FEEDBACK_DAYS ?? "30", 10) || 30)
  );
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const cardClass =
    "rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Settings</h1>
        <p className="mt-1 text-sm text-stone-600">Admin configuration</p>
      </div>

      <div className="space-y-6">
        {/* Admin key */}
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-stone-900">Admin access</h2>
          <p className="mt-1 text-sm text-stone-500">
            Control how you log in to the admin dashboard.
          </p>
          <div className="mt-4 rounded-xl bg-amber-50/80 border border-amber-200/60 p-4">
            <p className="text-sm font-medium text-stone-700">Admin key</p>
            <p className="mt-1 text-sm text-stone-600">
              Set <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-amber-900">ADMIN_SECRET</code> or{" "}
              <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-amber-900">NEXT_PUBLIC_ADMIN_KEY</code> in{" "}
              <code className="rounded bg-amber-100/80 px-1.5 py-0.5 text-amber-900">.env.local</code>.
              Restart the dev server after changing.
            </p>
          </div>
        </section>

        {/* Feedback period */}
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-stone-900">Feedback & improvement notes</h2>
          <p className="mt-1 text-sm text-stone-500">
            How many days of reviews are used for monthly improvement notes on the Overview page.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3">
              <span className="text-sm text-stone-500">Current period</span>
              <p className="mt-0.5 text-xl font-semibold text-stone-900">{feedbackDays} days</p>
            </div>
            <div className="text-sm text-stone-600 max-w-md">
              To change this, add <code className="rounded bg-stone-100 px-1">ADMIN_FEEDBACK_DAYS=30</code> to{" "}
              <code className="rounded bg-stone-100 px-1">.env.local</code> (e.g. 14, 30, 60). Restart the server.
            </div>
          </div>
        </section>

        {/* Currency & display */}
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-stone-900">Display</h2>
          <p className="mt-1 text-sm text-stone-500">
            How amounts and dates are shown across the admin dashboard.
          </p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50/50 px-4 py-3">
              <span className="text-sm font-medium text-stone-700">Currency</span>
              <span className="text-sm text-stone-600">NPR (Nepalese Rupee)</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50/50 px-4 py-3">
              <span className="text-sm font-medium text-stone-700">Sales & prices</span>
              <span className="text-sm text-stone-600">Shown in NPR</span>
            </li>
          </ul>
        </section>

        {/* Database / services */}
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-stone-900">Services</h2>
          <p className="mt-1 text-sm text-stone-500">
            Status of connected backends used by the app.
          </p>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50/50 px-4 py-3">
              <span className="text-sm font-medium text-stone-700">Supabase</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  hasSupabase
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${hasSupabase ? "bg-emerald-500" : "bg-amber-500"}`} />
                {hasSupabase ? "Connected" : "Not configured"}
              </span>
            </li>
          </ul>
          {!hasSupabase && (
            <p className="mt-3 text-xs text-stone-500">
              Set <code className="rounded bg-stone-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-stone-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> in .env.local.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
