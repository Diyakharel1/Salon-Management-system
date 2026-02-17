import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking details",
  description: "View your salon appointment confirmation and details.",
};

export default function BookingDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
