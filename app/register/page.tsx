import type { Metadata } from "next";
import Link from "next/link";
import { SalonRegisterForm } from "./SalonRegisterForm";

export const metadata: Metadata = {
  title: "Register your salon",
  description:
    "List your salon on Salon Booking Nepal. Fill out the form and we'll review your application.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href="/owner"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to owner portal
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-900">
          Register your salon
        </h1>
        <p className="mt-2 text-stone-600">
          Fill out the form below to list your salon on Salon Booking Nepal. Our team will review
          your application and get back to you within 1–2 business days.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <SalonRegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have a salon?{" "}
        <Link href="/owner" className="font-medium text-amber-600 hover:text-amber-700">
          Sign in with your owner key
        </Link>
      </p>
    </div>
  );
}
