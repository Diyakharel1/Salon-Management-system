import { supabaseAdmin } from "@/lib/supabaseServer";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminMessagesTable } from "./AdminMessagesTable";
import { EmptyStateTable } from "@/components/ui/EmptyState";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

export default async function AdminMessagesPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key;

  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_KEY;
  if (!adminSecret || key !== adminSecret) {
    return <AdminLoginForm redirectPath="/admin/messages" />;
  }

  const { data: messages, error } = await supabaseAdmin
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, source, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-semibold">Failed to load messages</p>
        <p className="mt-1 text-sm">{error.message}</p>
        <p className="mt-2 text-sm">
          Ensure the <code className="rounded bg-red-100 px-1">contact_messages</code> table exists (run migration{" "}
          <code className="rounded bg-red-100 px-1">006_contact_messages.sql</code> in Supabase).
        </p>
      </div>
    );
  }

  const list = messages ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Messages</h1>
        <p className="mt-1 text-sm text-stone-600">
          Contact form submissions from the website (latest 100)
        </p>
      </div>

      {list.length === 0 ? (
        <EmptyStateTable
          title="No messages yet"
          description="Contact form submissions will appear here."
        />
      ) : (
        <AdminMessagesTable messages={list} />
      )}
    </div>
  );
}
