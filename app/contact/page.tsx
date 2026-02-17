import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Salon Booking Nepal. Questions, support, or feedback.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
          Contact us
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-stone-600">
          Have a question or need help? Send us a message and we&apos;ll get back to you as soon as we can, usually within 24 hours.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form - takes more space on large screens */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-lg font-semibold text-stone-900">Send a message</h2>
            <p className="mt-1 text-sm text-stone-500">
              Fill in the form below and we&apos;ll reply to your email.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>

        {/* Sidebar - quick links and info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-6">
            <h2 className="font-semibold text-stone-900">Quick links</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/salons"
                  className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-amber-700"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  Browse salons
                </Link>
              </li>
              <li>
                <Link
                  href="/my-bookings"
                  className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-amber-700"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  My bookings
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-amber-700"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  About us
                </Link>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-stone-900">Response time</h2>
            <p className="mt-2 text-sm text-stone-600">
              We typically reply within 24 hours on business days. For urgent booking changes, use the phone number on your confirmation or the salon&apos;s public page.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-stone-500">
        <Link href="/" prefetch={false} className="text-amber-600 hover:text-amber-700">
          ← Back to home
        </Link>
        {" · "}
        <Link href="/about" className="text-amber-600 hover:text-amber-700">
          About us
        </Link>
      </p>
    </div>
  );
}
