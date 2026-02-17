import { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function OwnerEmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200/80 bg-stone-50/50 px-8 py-12 text-center">
      <p className="font-semibold text-stone-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-stone-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
