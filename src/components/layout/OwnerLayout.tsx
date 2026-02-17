"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/images";

const ICONS = {
  overview: (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  bookings: (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  services: (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2M5 11v10m0-10V5a2 2 0 012-2m0 0V5a2 2 0 012 2" />
    </svg>
  ),
  sales: (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reviews: (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
  settings: (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 2.31.826 1.37 1.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 2.31-1.37 1.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-2.31-.826-1.37-1.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-2.31 1.37-1.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const SIDEBAR_LINKS = [
  { href: "/owner", label: "Overview", iconKey: "overview" as const },
  { href: "/owner/bookings", label: "Bookings", iconKey: "bookings" as const },
  { href: "/owner/services", label: "Services", iconKey: "services" as const },
  { href: "/owner/sales", label: "Sales", iconKey: "sales" as const },
  { href: "/owner/reviews", label: "Reviews", iconKey: "reviews" as const },
  { href: "/owner/settings", label: "Settings", iconKey: "settings" as const },
] as const;

function NavLink({
  href,
  label,
  icon,
  keyParam,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  keyParam: string | null;
  isActive: boolean;
}) {
  const url = keyParam ? `${href}?key=${encodeURIComponent(keyParam)}` : href;
  return (
    <Link
      href={url}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-amber-500 text-white"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const keyParam = searchParams.get("key");
  const [authConfirmed, setAuthConfirmed] = useState<boolean | null>(null);
  const [salonName, setSalonName] = useState<string | null>(null);

  useEffect(() => {
    if (!keyParam) {
      setAuthConfirmed(false);
      setSalonName(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/owner/me?key=${encodeURIComponent(keyParam)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.salon) {
          setAuthConfirmed(true);
          setSalonName(data.salon.name ?? null);
        } else {
          setAuthConfirmed(false);
          setSalonName(null);
        }
      })
      .catch(() => {
        if (!cancelled) setAuthConfirmed(false);
        if (!cancelled) setSalonName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [keyParam]);

  // Show dashboard shell only when key is present and validated; otherwise only login (no sidebar, no redirect)
  const showShell = !!keyParam && authConfirmed === true;

  if (!showShell) {
    return <>{children}</>;
  }

  const headerLabel = salonName ?? "Owner";

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 8%, #fafaf9 25%, #fafaf9 100%)",
      }}
    >
      <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-stone-200 bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-stone-200 px-4">
          <Link href={keyParam ? `/owner?key=${encodeURIComponent(keyParam)}` : "/owner"} className="flex items-center gap-2">
            <Image src={BRAND.logo} alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" unoptimized />
            <span className="truncate font-semibold text-stone-900" title={headerLabel}>
              {headerLabel}
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {SIDEBAR_LINKS.map((link) => {
            const isActive =
              link.href === "/owner"
                ? pathname === "/owner"
                : pathname?.startsWith(link.href);
            return (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={ICONS[link.iconKey]}
                keyParam={keyParam}
                isActive={!!isActive}
              />
            );
          })}
        </nav>
        <div className="border-t border-stone-200 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to site
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-56">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200 bg-white/95 px-6 backdrop-blur">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              View site
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800">
              {salonName ? salonName.charAt(0).toUpperCase() : "O"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
