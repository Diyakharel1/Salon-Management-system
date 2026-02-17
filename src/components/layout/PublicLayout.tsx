"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChatWidget } from "@/components/ChatWidget";
import { BRAND } from "@/lib/images";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/salons", label: "Browse" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/my-bookings", label: "My bookings" },
] as const;

const PARTNER_LINKS = [
  { href: "/owner", label: "Salon" },
  { href: "/admin", label: "Admin" },
] as const;

const FOOTER_PRODUCT = [
  { href: "/salons", label: "Browse salons" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/my-bookings", label: "My bookings" },
];

const FOOTER_COMPANY = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/owner", label: "For salons" },
  { href: "/register-salon", label: "Register salon" },
  { href: "/admin", label: "Admin" },
];

const FOOTER_SUPPORT = [
  { href: "/contact", label: "Help center" },
  { href: "/contact", label: "Nepal support" },
  { href: "/salons", label: "Kathmandu · Lalitpur · Pokhara" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);
  const partnersRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex min-h-screen flex-col">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky top-0 z-50 h-16 border-b border-stone-200/60 bg-white/90 backdrop-blur-md"
      >
        <nav className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-4 py-0 sm:px-6 lg:px-8">
          <Link
            href="/"
            prefetch={false}
            className="flex shrink-0 items-center text-base font-bold tracking-tight text-stone-900 transition-colors hover:text-amber-600"
          >
            <span className="relative flex shrink-0 items-center justify-center overflow-visible">
              <img
                src={BRAND.logo}
                alt="Salon Booking Nepal"
                width={200}
                height={200}
                className="h-[140px] w-[140px] shrink-0 object-contain"
              />
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                prefetch={href === "/" ? false : undefined}
                className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
              >
                {label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <div className="relative" ref={partnersRef}>
              <button
                type="button"
                onClick={() => setPartnersOpen((o) => !o)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                aria-expanded={partnersOpen}
                aria-haspopup="true"
              >
                Partners
                <svg
                  className={`h-4 w-4 transition-transform ${partnersOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {partnersOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
                  >
                    {PARTNER_LINKS.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className="block px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                        onClick={() => setPartnersOpen(false)}
                      >
                        {label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link
              href="/salons"
              className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
            >
              Book now
            </Link>
          </div>
        </nav>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-stone-200/60 bg-white md:hidden"
            >
              <div className="space-y-0.5 px-3 py-3">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    prefetch={href === "/" ? false : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  >
                    {label}
                  </Link>
                ))}
                <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Partners
                </p>
                {PARTNER_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/salons"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-3 block rounded-lg bg-stone-900 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-stone-800"
                >
                  Book now
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main content */}
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer with columns */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <Link href="/" prefetch={false} className="inline-block">
                <img src={BRAND.logo} alt="Salon Booking Nepal" width={120} height={120} className="h-[100px] w-[100px] shrink-0 object-contain" />
              </Link>
              <p className="mt-3 text-sm text-stone-500">
                Book appointments at top salons across Kathmandu, Lalitpur, Pokhara & more.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-stone-900">Product</h3>
              <ul className="mt-4 space-y-2">
                {FOOTER_PRODUCT.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-stone-500 transition-colors hover:text-amber-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-stone-900">Company</h3>
              <ul className="mt-4 space-y-2">
                {FOOTER_COMPANY.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-stone-500 transition-colors hover:text-amber-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support - Nepal context */}
            <div>
              <h3 className="font-semibold text-stone-900">Support</h3>
              <ul className="mt-4 space-y-2">
                {FOOTER_SUPPORT.map(({ href, label }) => (
                  <li key={`${href}-${label}`}>
                    <Link
                      href={href}
                      className="text-sm text-stone-500 transition-colors hover:text-amber-600"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-stone-200 pt-8">
            <p className="text-center text-sm text-stone-500" suppressHydrationWarning>
              © {new Date().getFullYear()} Serving salons across Nepal.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating help/chat button */}
      <ChatWidget />
    </div>
  );
}
