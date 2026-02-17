import type { Metadata } from "next";
import Link from "next/link";
import { RegisterSalonForm } from "./RegisterSalonForm";

export const metadata: Metadata = {
  title: "Register your salon",
  description: "Add your salon to Salon Booking Nepal. Get an owner key and start receiving bookings.",
};

export default function RegisterSalonPage() {
  return (
    <div className="mx-auto max-w-xl">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
          Register your salon
        </h1>
        <p className="mt-3 text-lg text-stone-600">
          List your salon on Salon Booking Nepal. You&apos;ll get an owner key to manage bookings, services, and more.
        </p>
      </section>

      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm md:p-8">
        <RegisterSalonForm />
      </div>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an owner key?{" "}
        <Link href="/owner" className="text-amber-600 hover:text-amber-700">
          Log in to your salon dashboard
        </Link>
      </p>
    </div>
  );
}
