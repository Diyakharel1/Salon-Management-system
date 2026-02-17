"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { BOOKING_STATUSES } from "@/types/booking";

export function OwnerBookingsClient({
  ownerKey,
  from,
  to,
  status,
}: {
  ownerKey: string;
  from?: string;
  to?: string;
  status?: string;
}) {
  return (
    <form
      method="get"
      action="/owner/bookings"
      className="flex flex-wrap items-end gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="key" value={ownerKey} />
      <div>
        <label htmlFor="from" className="block text-xs font-medium text-stone-600">From</label>
        <input id="from" name="from" type="date" defaultValue={from} className="mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200" />
      </div>
      <div>
        <label htmlFor="to" className="block text-xs font-medium text-stone-600">To</label>
        <input id="to" name="to" type="date" defaultValue={to} className="mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200" />
      </div>
      <div>
        <label htmlFor="status" className="block text-xs font-medium text-stone-600">Status</label>
        <select id="status" name="status" defaultValue={status ?? ""} className="mt-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-600"
      >
        Filter
      </button>
    </form>
  );
}

export function OwnerBookingActions({
  bookingId,
  currentStatus,
  ownerKey,
}: {
  bookingId: string;
  currentStatus: string;
  ownerKey: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch(
        `/api/owner/bookings/${bookingId}?key=${encodeURIComponent(ownerKey)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast("Status updated", "success");
        router.refresh();
      } else {
        toast(data.error ?? "Failed to update status", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {BOOKING_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => updateStatus(s)}
          disabled={s === currentStatus}
          className={`rounded px-2 py-1 text-xs font-medium ${
            s === currentStatus
              ? "bg-stone-200 text-stone-500 cursor-default"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
