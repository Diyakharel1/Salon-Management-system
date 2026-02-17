"use client";

import Link from "next/link";

type ErrorAlertProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function ErrorAlert({
  title = "Something went wrong",
  message,
  onRetry,
  backHref = "/",
  backLabel = "Back to home",
  className = "",
}: ErrorAlertProps) {
  return (
    <div
      className={`rounded-2xl border border-red-200/80 bg-red-50 p-6 shadow-sm ${className}`}
      role="alert"
    >
      <div className="flex gap-3">
        <svg
          className="h-6 w-6 shrink-0 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="font-semibold text-red-900">{title}</h3>
          <p className="mt-1 text-sm text-red-800">{message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {backHref && (
              <Link
                href={backHref}
                className="inline-flex items-center text-sm font-medium text-red-700 hover:underline"
              >
                {backLabel}
              </Link>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-medium text-red-700 hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
