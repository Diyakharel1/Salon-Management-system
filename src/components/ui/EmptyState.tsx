"use client";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

const DEFAULT_ICONS = {
  search: (
    <svg className="h-12 w-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  services: (
    <svg className="h-12 w-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  ),
  reviews: (
    <svg className="h-12 w-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  data: (
    <svg className="h-12 w-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  error: (
    <svg className="h-12 w-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-md ${className}`}
    >
      <div className="mb-4">{icon ?? DEFAULT_ICONS.data}</div>
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-stone-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function EmptyStateSearch({
  onClear,
  title = "No results found",
  description = "Try adjusting your search or filters.",
}: {
  onClear?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={DEFAULT_ICONS.search}
      title={title}
      description={description}
      action={
        onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Clear filters
          </button>
        ) : undefined
      }
    />
  );
}

export function EmptyStateServices() {
  return (
    <EmptyState
      icon={DEFAULT_ICONS.services}
      title="No services available"
      description="This salon hasn't added any services yet. Check back later."
    />
  );
}

export function EmptyStateReviews() {
  return (
    <EmptyState
      icon={DEFAULT_ICONS.reviews}
      title="No reviews yet"
      description="Be the first to share your experience!"
    />
  );
}

export function EmptyStateTable({
  title = "No data found",
  description = "There's nothing to show here yet.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={DEFAULT_ICONS.data}
      title={title}
      description={description}
    />
  );
}
