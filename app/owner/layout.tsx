import { OwnerLayout } from "@/components/layout/OwnerLayout";

export default function OwnerRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerLayout>{children}</OwnerLayout>;
}
