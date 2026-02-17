"use client";

import { useState } from "react";

type Registration = {
  id: string;
  salon_name: string;
  slug: string;
  city: string;
  address: string | null;
  phone: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

export function RegistrationActions({
  registration,
  adminKey,
}: {
  registration: Registration;
  adminKey: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState(registration.admin_notes ?? "");
  const [showNotes, setShowNotes] = useState(false);

  async function handleAction(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/registrations/${registration.id}?key=${encodeURIComponent(adminKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed");
      if (action === "approve" && data.owner_key) {
        alert(`Salon approved!\n\nOwner key (share with applicant): ${data.owner_key}\n\nSalon slug: ${data.slug}`);
      }
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (registration.status !== "pending") {
    return (
      <div className="text-xs text-stone-500">
        {registration.admin_notes && (
          <p title={registration.admin_notes} className="max-w-[200px] truncate">
            {registration.admin_notes}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showNotes ? (
        <div>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Admin notes (optional)"
            rows={2}
            className="w-full rounded border border-stone-300 px-2 py-1 text-xs focus:border-stone-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowNotes(false)}
            className="mt-1 text-xs text-stone-500 hover:text-stone-700"
          >
            Hide notes
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="text-xs text-stone-500 hover:text-stone-700"
        >
          {adminNotes ? "Edit notes" : "Add notes"}
        </button>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAction("approve")}
          disabled={!!loading}
          className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "approve" ? "…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => handleAction("reject")}
          disabled={!!loading}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading === "reject" ? "…" : "Reject"}
        </button>
      </div>
    </div>
  );
}
