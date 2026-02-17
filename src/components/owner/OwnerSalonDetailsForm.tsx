"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

type Salon = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
};

export function OwnerSalonDetailsForm({
  salon,
  ownerKey,
}: {
  salon: Salon;
  ownerKey: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(salon.name);
  const [city, setCity] = useState(salon.city ?? "");
  const [address, setAddress] = useState(salon.address ?? "");
  const [phone, setPhone] = useState(salon.phone ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/owner/me?key=${encodeURIComponent(ownerKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast("Salon details updated", "success");
        router.refresh();
      } else {
        toast(data.error ?? "Failed to update", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="owner-salon-name" className="block text-sm font-medium text-stone-700">
          Name
        </label>
        <input
          id="owner-salon-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-500">Slug</label>
        <p className="mt-1 text-sm text-stone-600">{salon.slug}</p>
        <p className="mt-0.5 text-xs text-stone-400">URL identifier (cannot be changed here)</p>
      </div>
      <div>
        <label htmlFor="owner-salon-city" className="block text-sm font-medium text-stone-700">
          City
        </label>
        <input
          id="owner-salon-city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>
      <div>
        <label htmlFor="owner-salon-address" className="block text-sm font-medium text-stone-700">
          Address
        </label>
        <input
          id="owner-salon-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>
      <div>
        <label htmlFor="owner-salon-phone" className="block text-sm font-medium text-stone-700">
          Phone
        </label>
        <input
          id="owner-salon-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
