"use client";

import { useSearchParams } from "next/navigation";
import { AdminOcrClient } from "./AdminOcrClient";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminOcrPage() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");

  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return <AdminLoginForm redirectPath="/admin/ocr" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">OCR Upload</h1>
        <p className="mt-1 text-sm text-stone-600">
          Upload a bill image to extract text and save to sales
        </p>
      </div>
      <AdminOcrClient adminKey={key!} />
    </div>
  );
}
