"use client";

import { useState } from "react";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/AdminTable";

type Message = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  created_at: string;
};

export function AdminMessagesTable({ messages }: { messages: Message[] }) {
  const [selected, setSelected] = useState<Message | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const truncate = (s: string, len: number) =>
    s.length <= len ? s : s.slice(0, len) + "…";

  return (
    <>
      <AdminTable>
        <AdminTableHeader>
          <AdminTableHeaderCell>Date</AdminTableHeaderCell>
          <AdminTableHeaderCell>Name</AdminTableHeaderCell>
          <AdminTableHeaderCell>Phone</AdminTableHeaderCell>
          <AdminTableHeaderCell>Email</AdminTableHeaderCell>
          <AdminTableHeaderCell>Subject</AdminTableHeaderCell>
          <AdminTableHeaderCell>Message</AdminTableHeaderCell>
          <AdminTableHeaderCell> </AdminTableHeaderCell>
        </AdminTableHeader>
        <AdminTableBody>
          {messages.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell className="whitespace-nowrap text-stone-500">
                {formatDate(row.created_at)}
              </AdminTableCell>
              <AdminTableCell className="font-medium text-stone-900">{row.name}</AdminTableCell>
              <AdminTableCell className="text-stone-600">{row.phone ?? "-"}</AdminTableCell>
              <AdminTableCell className="text-stone-600">{row.email ?? "-"}</AdminTableCell>
              <AdminTableCell className="text-stone-600">{row.subject ?? "-"}</AdminTableCell>
              <AdminTableCell className="max-w-xs text-stone-600">
                <span className="line-clamp-2">{truncate(row.message, 80)}</span>
              </AdminTableCell>
              <AdminTableCell>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                >
                  View
                </button>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTableBody>
      </AdminTable>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Message details"
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-xl border border-stone-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-semibold text-stone-900">Message details</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-stone-500">Date</dt>
                <dd className="mt-0.5 text-stone-900">{formatDate(selected.created_at)}</dd>
              </div>
              <div>
                <dt className="font-medium text-stone-500">Name</dt>
                <dd className="mt-0.5 text-stone-900">{selected.name}</dd>
              </div>
              {selected.email && (
                <div>
                  <dt className="font-medium text-stone-500">Email</dt>
                  <dd className="mt-0.5 text-stone-900">{selected.email}</dd>
                </div>
              )}
              {selected.phone && (
                <div>
                  <dt className="font-medium text-stone-500">Phone</dt>
                  <dd className="mt-0.5 text-stone-900">{selected.phone}</dd>
                </div>
              )}
              {selected.subject && (
                <div>
                  <dt className="font-medium text-stone-500">Subject</dt>
                  <dd className="mt-0.5 text-stone-900">{selected.subject}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-stone-500">Message</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-stone-900">
                  {selected.message}
                </dd>
              </div>
              {selected.source && (
                <div>
                  <dt className="font-medium text-stone-500">Source</dt>
                  <dd className="mt-0.5 text-stone-600">{selected.source}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
