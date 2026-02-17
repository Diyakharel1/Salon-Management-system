"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function OwnerLoginForm({
  redirectPath = "/owner",
  invalidKey = false,
}: {
  redirectPath?: string;
  invalidKey?: boolean;
}) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Please enter your owner key.");
      return;
    }
    setError("");
    const base = redirectPath.replace(/\?.*$/, "");
    router.push(`${base}?key=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 8%, #fafaf9 25%, #fafaf9 100%)",
      }}
    >
      <div className="absolute left-4 top-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Owner dashboard</h1>
        <p className="mt-2 text-stone-600">
          Paste your owner key to access your salon dashboard.
        </p>
        {invalidKey && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid owner key. Check the key and try again.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Owner key"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200/50"
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Continue
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-600">
          Don&apos;t have a salon yet?{" "}
          <Link href="/register" className="font-medium text-amber-600 hover:text-amber-700">
            Register your salon
          </Link>
        </p>
        <div className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 text-left text-sm text-stone-600">
          <p className="font-medium text-stone-700">How to get an owner key</p>
          <p className="mt-1">
            <Link href="/register" className="text-amber-600 hover:text-amber-700">Register your salon</Link>
            {" "}and our team will review your application. Once approved, you&apos;ll receive your owner key by email.
          </p>
          <p className="mt-2 text-stone-500">
            Or if your salon is already listed, an admin can generate a key from the Salons page.
          </p>
        </div>
      </div>
    </div>
  );
}
