import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { OwnerLoginForm } from "@/components/owner/OwnerLoginForm";
import { OwnerOverviewClient } from "@/components/owner/OwnerOverviewClient";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

export default async function OwnerPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key?.trim() || null;

  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return <OwnerLoginForm redirectPath="/owner" invalidKey={!!key} />;
  }

  return <OwnerOverviewClient ownerKey={key!} salonName={salon.name} />;
}
