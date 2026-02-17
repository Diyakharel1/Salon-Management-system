import { getSalonByOwnerKey } from "@/lib/ownerAuth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { OwnerLoginForm } from "@/components/owner/OwnerLoginForm";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeaderCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from "@/components/admin/AdminTable";
import { OwnerEmptyState } from "@/components/owner/OwnerEmptyState";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

export default async function OwnerReviewsPage({ searchParams }: Props) {
  const params = await searchParams;
  const key = params.key?.trim() || null;
  const salon = await getSalonByOwnerKey(key);
  if (!salon) {
    return <OwnerLoginForm redirectPath="/owner/reviews" />;
  }

  const { data: reviews, error } = await supabaseAdmin
    .from("reviews")
    .select("id, feedback, rating, created_at")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const reviewIds = (reviews ?? []).map((r) => r.id);
  let aiMap: Record<string, { sentiment: string }> = {};
  if (reviewIds.length > 0) {
    const { data: ai } = await supabaseAdmin
      .from("feedback_ai")
      .select("review_id, sentiment")
      .in("review_id", reviewIds);
    aiMap = (ai ?? []).reduce(
      (acc, row) => ({ ...acc, [row.review_id]: { sentiment: (row.sentiment ?? "neutral").toLowerCase() } }),
      {} as Record<string, { sentiment: string }>
    );
  }

  const withRating = (reviews ?? []).filter((r) => typeof (r as { rating?: number }).rating === "number");
  const avgRating =
    withRating.length > 0
      ? withRating.reduce((s, r) => s + ((r as { rating: number }).rating ?? 0), 0) / withRating.length
      : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Reviews</h1>
          <p className="mt-1 text-sm text-stone-600">{salon.name}</p>
        </div>
        {avgRating != null && (
          <div className="rounded-xl border border-amber-200/60 bg-white/95 px-4 py-2">
            <span className="text-sm text-stone-500">Average rating</span>
            <p className="text-xl font-bold text-stone-900">{avgRating.toFixed(1)} ★</p>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-red-600 text-sm">Failed to load reviews.</p>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableHeaderCell>Date</AdminTableHeaderCell>
            <AdminTableHeaderCell>Rating</AdminTableHeaderCell>
            <AdminTableHeaderCell>Sentiment</AdminTableHeaderCell>
            <AdminTableHeaderCell>Feedback</AdminTableHeaderCell>
          </AdminTableHeader>
          <AdminTableBody>
            {(reviews ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="p-0">
                  <OwnerEmptyState
                    title="No reviews yet"
                    description="Customer reviews from your salon page will appear here with sentiment analysis."
                  />
                </td>
              </tr>
            ) : (
              (reviews ?? []).map((r) => {
                const sentiment = aiMap[r.id]?.sentiment ?? "neutral";
                return (
                  <AdminTableRow key={r.id}>
                    <AdminTableCell>{formatDate(r.created_at)}</AdminTableCell>
                    <AdminTableCell>
                      {(r as { rating?: number }).rating != null
                        ? `${(r as { rating: number }).rating} ★`
                        : "-"}
                    </AdminTableCell>
                    <AdminTableCell>
                      <StatusBadge
                        status={sentiment}
                        variant={sentiment === "positive" ? "positive" : sentiment === "negative" ? "negative" : "neutral"}
                      />
                    </AdminTableCell>
                    <AdminTableCell className="max-w-md">
                      <span className="line-clamp-2">{r.feedback}</span>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })
            )}
          </AdminTableBody>
        </AdminTable>
      )}
    </div>
  );
}
