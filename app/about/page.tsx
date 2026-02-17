import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Learn about Salon Booking Nepal - how we connect customers with the best salons across Kathmandu, Lalitpur, Pokhara and beyond.",
};

const STEPS = [
  {
    title: "Search",
    description: "Find salons by location or service - haircut, facial, spa, and more.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Choose & book",
    description: "Pick your preferred service, date, and time. Enter your details and confirm in seconds.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Enjoy",
    description: "Get confirmed, track your booking, or message the salon on WhatsApp - all in one place.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const CITIES = ["Kathmandu", "Lalitpur", "Pokhara", "Bhaktapur", "Biratnagar", "Chitwan", "Dharan"];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <section className="rounded-3xl border border-stone-200/80 bg-gradient-to-br from-amber-50/80 to-white p-8 shadow-sm md:p-12">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
          About Salon Booking Nepal
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
          We connect you with the best salons across Nepal - so you can book your perfect appointment in minutes, without the back-and-forth.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/salons"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-amber-600"
          >
            Browse salons
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Contact us
          </Link>
        </div>
      </section>

      {/* What we do */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-stone-900">What we do</h2>
        <p className="mt-3 text-stone-600 leading-relaxed">
          Salon Booking Nepal is your one-stop platform to discover salons in Kathmandu, Lalitpur, Pokhara, and beyond.
          Browse services, compare prices, read reviews, and book appointments online - no phone calls needed. We make it easy to find the right salon and secure your slot in a few clicks.
        </p>
      </section>

      {/* How it works */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold text-stone-900">How it works</h2>
        <p className="mt-1 text-sm text-stone-500">Three simple steps to your next appointment</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                {step.icon}
              </div>
              <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-600">
                Step {i + 1}
              </span>
              <h3 className="mt-1 font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-6">
          <Link href="/#how-it-works" className="font-medium text-amber-600 hover:text-amber-700">
            See how it works on the homepage →
          </Link>
        </p>
      </section>

      {/* Serving Nepal */}
      <section className="mt-14 rounded-2xl border border-stone-200/80 bg-stone-50/50 p-6 md:p-8">
        <h2 className="font-semibold text-stone-900">Serving Nepal</h2>
        <p className="mt-2 text-stone-600">
          We’re focused on making salon booking easy across Nepal. More areas and salons are added regularly.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <span
              key={city}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200/80"
            >
              {city}
            </span>
          ))}
        </div>
      </section>

      {/* Footer links */}
      <p className="mt-12 text-center text-sm text-stone-500">
        <Link href="/" className="text-amber-600 hover:text-amber-700">
          ← Back to home
        </Link>
        {" · "}
        <Link href="/contact" className="text-amber-600 hover:text-amber-700">
          Contact us
        </Link>
      </p>
    </div>
  );
}
