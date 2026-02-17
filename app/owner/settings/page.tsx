import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { OwnerLoginForm } from "@/components/owner/OwnerLoginForm";
import { OwnerSalonDetailsForm } from "@/components/owner/OwnerSalonDetailsForm";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

export default async function OwnerSettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key?.trim() || null;
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return <OwnerLoginForm redirectPath="/owner/settings" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Settings</h1>
        <p className="mt-1 text-sm text-stone-600">Owner dashboard for {salon.name}</p>
      </div>

      <div className="rounded-2xl border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-stone-200/30 backdrop-blur">
        <h2 className="text-lg font-semibold text-stone-900">Salon details</h2>
        <p className="mt-1 text-sm text-stone-500">
          Edit your salon name, city, address, and phone. Slug and owner key cannot be changed here.
        </p>
        <OwnerSalonDetailsForm salon={salon} ownerKey={key!} />
      </div>
    </div>
  );
}
