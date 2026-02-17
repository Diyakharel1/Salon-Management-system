"use client";

import Link from "next/link";
import { useState } from "react";

export function RegisterSalonForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ name: string; slug: string; owner_key: string; owner_url: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/register-salon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          city: city.trim(),
          address: address.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Registration failed");
      setResult({
        name: data.name,
        slug: data.slug,
        owner_key: data.owner_key,
        owner_url: data.owner_url ?? `/owner?key=${encodeURIComponent(data.owner_key)}`,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success" && result) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-emerald-900">Salon registered</h2>
        <p className="mt-2 text-stone-700">
          <strong>{result.name}</strong> is now on Salon Booking Nepal. Add your services and start receiving bookings.
        </p>
        <div className="mt-6 rounded-xl border border-emerald-200 bg-white p-4 text-left">
          <p className="text-xs font-medium uppercase text-stone-500">Your owner key (save this)</p>
          <p className="mt-1 break-all font-mono text-sm font-semibold text-stone-900">{result.owner_key}</p>
          <p className="mt-2 text-xs text-stone-600">
            Use this key to log in to your salon dashboard. Bookmark the link below.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={result.owner_url}
            className="inline-flex items-center justify-center rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Open salon dashboard
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
          Salon name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kathmandu Cuts"
          className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          required
        />
      </div>
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-stone-700">
          URL slug <span className="text-stone-400">(optional)</span>
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          placeholder="e.g. kathmandu-cuts (auto from name if empty)"
          className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 font-mono text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-stone-700">
          City <span className="text-red-500">*</span>
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Kathmandu"
          className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          required
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-stone-700">
          Address <span className="text-stone-400">(optional)</span>
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. New Road, Kathmandu"
          className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700">
          Phone <span className="text-stone-400">(optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 9800000000"
          className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>
      {errorMsg && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-xl bg-amber-500 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-70 sm:w-auto sm:min-w-[200px]"
      >
        {status === "submitting" ? "Registering…" : "Register salon"}
      </button>
    </form>
  );
}
