import Link from "next/link";
import { ChatWidget } from "@/components/ChatWidget";
import { BRAND } from "@/lib/images";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky navbar - charcoal + gold accent */}
      <header className="sticky top-0 z-50 h-16 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <nav className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 py-0 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center text-xl font-bold tracking-tight text-stone-900 transition-colors hover:text-amber-600"
          >
            <span className="relative flex shrink-0 items-center justify-center overflow-visible">
              <img
                src={BRAND.logo}
                alt="Salon Booking Nepal"
                width={200}
                height={200}
                className="h-[140px] w-[140px] shrink-0 object-contain text-stone-800"
              />
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              Home
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              Browse
            </Link>
            <Link
              href="/admin"
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              Admin
            </Link>
          </div>
        </nav>
      </header>

      {/* Main content - consistent section spacing */}
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-stone-500">
              © {new Date().getFullYear()} All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/"
                className="text-sm text-stone-500 transition-colors hover:text-amber-600"
              >
                Home
              </Link>
              <Link
                href="/admin"
                className="text-sm text-stone-500 transition-colors hover:text-amber-600"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
