"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/context/ToastContext";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/AdminTable";

type Salon = {
  id: string;
  name: string;
  slug: string;
};

type ServiceItem = {
  name: string;
  price: number | null;
};

export function AdminOcrClient({ adminKey }: { adminKey: string }) {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<{
    sale_id: string;
    total_price: number | null;
    services: ServiceItem[];
    raw_text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSalons() {
      const { data } = await supabase
        .from("salons")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      setSalons(data ?? []);
      if (data?.length) {
        setSelectedSlug(data[0].slug);
      }
    }
    fetchSalons();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedSlug) return;

    setStatus("uploading");
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("salonSlug", selectedSlug);

    try {
      const res = await fetch("/api/ai/ocr-bill", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error ?? "Upload failed";
        setError(errMsg);
        setStatus("error");
        toast(errMsg, "error");
        return;
      }

      setResult(data);
      setStatus("success");
      setFile(null);
      toast("Bill uploaded and sale saved!", "success");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Upload failed";
      setError(errMsg);
      setStatus("error");
      toast(errMsg, "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="salon" className="block text-sm font-medium text-stone-700">
              Salon
            </label>
            <select
              id="salon"
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-3 text-stone-900 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/20"
            >
              {salons.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium text-stone-700">
              Bill image
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "uploading" || !file}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 font-semibold text-white shadow-md transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "uploading" ? "Processing…" : "Upload & Extract"}
          </button>
        </form>
      </div>

      {status === "success" && result && (
        <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-md">
          <h2 className="font-semibold text-emerald-900">Sale saved</h2>
          <p className="text-sm text-emerald-800">
            Sale ID: <span className="font-mono">{result.sale_id}</span>
            {result.total_price != null && (
              <> · Total: NPR {result.total_price.toLocaleString()}</>
            )}
          </p>

          {result.services.length > 0 && (
            <AdminTable>
              <AdminTableHeader>
                <AdminTableHeaderCell>Name</AdminTableHeaderCell>
                <AdminTableHeaderCell>Price</AdminTableHeaderCell>
              </AdminTableHeader>
              <AdminTableBody>
                {result.services.map((item, i) => (
                  <AdminTableRow key={i}>
                    <AdminTableCell className="font-medium">{item.name}</AdminTableCell>
                    <AdminTableCell>
                      {item.price != null ? `NPR ${item.price}` : "-"}
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          )}

          <div>
            <button
              type="button"
              onClick={() => setRawTextOpen(!rawTextOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-emerald-200 bg-white px-4 py-2 text-left text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Raw OCR text
              <span className="text-stone-500">{rawTextOpen ? "▼" : "▶"}</span>
            </button>
            {rawTextOpen && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-emerald-200 bg-white p-4 text-xs text-stone-700 whitespace-pre-wrap">
                {result.raw_text || "(empty)"}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
