"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm({ redirectPath = "/admin" }: { redirectPath?: string }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Please enter the admin key.");
      return;
    }
    setError("");
    const base = redirectPath.replace(/\?.*$/, "");
    const separator = base.includes("?") ? "&" : "?";
    router.push(`${base}${separator}key=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 8%, #fafaf9 25%, #fafaf9 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Admin login</h1>
        <p className="mt-2 text-stone-600">
          Enter your admin key to access the dashboard.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200/50"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
