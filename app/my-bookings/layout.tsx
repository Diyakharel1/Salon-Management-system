import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My bookings",
  description: "View and track your salon appointments. Enter your phone number to see upcoming and past bookings.",
};

export default function MyBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
