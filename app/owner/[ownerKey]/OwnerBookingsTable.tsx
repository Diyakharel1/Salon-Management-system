"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";

type Booking = {
  id: string;
  customer_name: string;
  customer_phone: string;
  start_time: string;
  end_time: string | null;
  status: string;
  service: { name: string; price: number } | null;
};

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;

export function OwnerBookingsTable({
  ownerKey,
  salonId,
  salonName,
}: {
  ownerKey: string;
  salonId: string;
  salonName: string;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();

  async function fetchBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/owner/${ownerKey}/bookings?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setBookings(data.bookings ?? []);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to load bookings", "error");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, [ownerKey, statusFilter]);

  async function updateStatus(bookingId: string, status: string) {
    try {
      const res = await fetch(`/api/owner/${ownerKey}/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
      toast("Status updated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-stone-100 text-stone-700",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-red-100 text-red-800",
  };

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 p-4">
        <h2 className="text-lg font-semibold text-stone-900">Manage bookings</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-stone-500">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">No bookings found.</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-600">Date/Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-600">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-600">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-stone-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {bookings.map((b) => (
                <tr key={b.id} className="text-sm">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-900">
                    {formatDate(b.start_time)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{b.customer_name}</p>
                    <p className="text-xs text-stone-500">{b.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{b.service?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[b.status] ?? "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      className="rounded border border-stone-300 px-2 py-1 text-xs focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
