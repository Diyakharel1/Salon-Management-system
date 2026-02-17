"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

type Service = { id: string; name: string; price: number; duration_min: number; is_active: boolean };

export function OwnerServicesClient({
  ownerKey,
  mode,
  service,
}: {
  ownerKey: string;
  mode: "add" | "edit" | "delete";
  service?: Service;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState(service?.price ?? 0);
  const [duration_min, setDuration_min] = useState(service?.duration_min ?? 30);
  const [is_active, setIs_active] = useState(service?.is_active ?? true);

  const keyParam = () => `key=${encodeURIComponent(ownerKey)}`;

  if (mode === "add") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-600"
        >
          Add service
        </button>
        {showForm && (
          <form
            className="mt-4 flex flex-wrap items-end gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const res = await fetch(`/api/owner/services?${keyParam()}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: name.trim(), price, duration_min, is_active }),
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                  toast("Service added", "success");
                  setShowForm(false);
                  setName("");
                  setPrice(0);
                  setDuration_min(30);
                  setIs_active(true);
                  router.refresh();
                } else {
                  toast(data.error ?? "Failed to add service", "error");
                }
              } catch (err) {
                toast(err instanceof Error ? err.message : "Failed to add service", "error");
              } finally {
                setLoading(false);
              }
            }}
          >
            <input
              placeholder="Service name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm w-48"
              required
            />
            <input
              type="number"
              placeholder="Price NPR"
              value={price || ""}
              onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm w-28"
              min={0}
            />
            <input
              type="number"
              placeholder="Duration min"
              value={duration_min || ""}
              onChange={(e) => setDuration_min(parseInt(e.target.value, 10) || 30)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm w-24"
              min={1}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={is_active} onChange={(e) => setIs_active(e.target.checked)} />
              Active
            </label>
            <button type="submit" disabled={loading} className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 disabled:opacity-50">
              {loading ? "Saving…" : "Save"}
            </button>
          </form>
        )}
      </div>
    );
  }

  if (mode === "edit" && service) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setName(service.name);
            setPrice(service.price);
            setDuration_min(service.duration_min);
            setIs_active(service.is_active);
            setShowForm(true);
          }}
          className="mr-2 rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
        >
          Edit
        </button>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
            <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold text-stone-900">Edit service</h3>
              <form
                className="mt-4 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    const res = await fetch(`/api/owner/services/${service.id}?${keyParam()}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: name.trim(), price, duration_min, is_active }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok) {
                      toast("Service updated", "success");
                      setShowForm(false);
                      router.refresh();
                    } else {
                      toast(data.error ?? "Failed to update service", "error");
                    }
                  } catch (err) {
                    toast(err instanceof Error ? err.message : "Failed to update service", "error");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  required
                />
                <input
                  type="number"
                  placeholder="Price NPR"
                  value={price || ""}
                  onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  min={0}
                />
                <input
                  type="number"
                  placeholder="Duration (min)"
                  value={duration_min || ""}
                  onChange={(e) => setDuration_min(parseInt(e.target.value, 10) || 30)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  min={1}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={is_active} onChange={(e) => setIs_active(e.target.checked)} />
                  Active
                </label>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={loading} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-600 disabled:opacity-50">
                    Save
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
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

  if (mode === "delete" && service) {
    return (
      <button
        type="button"
        onClick={async () => {
          if (!confirm("Delete this service?")) return;
          setLoading(true);
          try {
            const res = await fetch(`/api/owner/services/${service.id}?${keyParam()}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              toast("Service deleted", "success");
              router.refresh();
            } else {
              toast(data.error ?? "Failed to delete service", "error");
            }
          } catch (err) {
            toast(err instanceof Error ? err.message : "Failed to delete service", "error");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    );
  }

  return null;
}
