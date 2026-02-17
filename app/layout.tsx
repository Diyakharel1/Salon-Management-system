import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { LayoutSwitcher } from "@/components/layout/LayoutSwitcher";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Salon Booking Nepal | Book Your Perfect Appointment",
    template: "%s | Salon Booking Nepal",
  },
  description:
    "Find and book appointments at top salons across Nepal. Kathmandu, Lalitpur, Pokhara & more. Real-time availability, easy booking.",
  keywords: ["salon", "booking", "Nepal", "Kathmandu", "beauty", "appointment"],
  icons: {
    icon: "/brand/favicon.svg",
  },
  openGraph: {
    title: "Salon Booking Nepal",
    description: "Find and book appointments at your favorite salons in Nepal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${dmSans.variable} ${geistMono.variable} min-h-screen antialiased`}
        style={{
          background:
            "linear-gradient(180deg, #fffbeb 0%, #fef3c7 8%, #fafaf9 25%, #fafaf9 100%)",
        }}
      >
        <ToastProvider>
          <LayoutSwitcher>{children}</LayoutSwitcher>
        </ToastProvider>
      </body>
    </html>
  );
}
