"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export type SalonRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  timezone: string | null;
  open_time: string | null;
  close_time: string | null;
  owner_key: string | null;
};

function toTimeInputValue(t: string | null): string {
  if (!t) return "10:00";
  const match = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return "10:00";
}

export function AdminSalonActions({
  salon,
  adminKey,
}: {
  salon: SalonRow;
  adminKey: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [name, setName] = useState(salon.name);
  const [slug, setSlug] = useState(salon.slug);
  const [city, setCity] = useState(salon.city ?? "");
  const [address, setAddress] = useState(salon.address ?? "");
  const [phone, setPhone] = useState(salon.phone ?? "");
  const [is_active, setIsActive] = useState(salon.is_active);
  const [timezone, setTimezone] = useState(salon.timezone ?? "Asia/Kathmandu");
  const [open_time, setOpenTime] = useState(toTimeInputValue(salon.open_time));
  const [close_time, setCloseTime] = useState(toTimeInputValue(salon.close_time));

  const keyQ = `key=${encodeURIComponent(adminKey)}`;

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/salons/${salon.id}?${keyQ}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          city: city || undefined,
          address: address || null,
          phone: phone || null,
          is_active,
          timezone,
          open_time,
          close_time,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast("Salon updated", "success");
        setShowEdit(false);
        router.refresh();
      } else {
        toast(data.error ?? "Failed to update salon", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove salon "${salon.name}"? This will delete the salon and all its services. It will fail if there are existing bookings.`)) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/salons/${salon.id}?${keyQ}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast("Salon removed", "success");
        router.refresh();
      } else {
        toast(data.error ?? "Failed to remove salon", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to remove", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setName(salon.name);
            setSlug(salon.slug);
            setCity(salon.city ?? "");
            setAddress(salon.address ?? "");
            setPhone(salon.phone ?? "");
            setIsActive(salon.is_active);
            setTimezone(salon.timezone ?? "Asia/Kathmandu");
            setOpenTime(toTimeInputValue(salon.open_time));
            setCloseTime(toTimeInputValue(salon.close_time));
            setShowEdit(true);
          }}
          className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteLoading}
          className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {deleteLoading ? "…" : "Remove"}
        </button>
      </div>

      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowEdit(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-stone-900">Edit salon</h3>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div>
                <label className="block text-xs font-medium text-stone-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600">City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={is_active}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <label htmlFor="is_active" className="text-sm text-stone-700">Active</label>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600">Timezone</label>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  placeholder="Asia/Kathmandu"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600">Open</label>
                  <input
                    type="time"
                    value={open_time}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600">Close</label>
                  <input
                    type="time"
                    value={close_time}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-600 disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
