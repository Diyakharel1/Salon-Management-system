"use client";

import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "gold" | "positive" | "negative" | "neutral" | "outline";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-stone-800 text-white",
  gold: "bg-amber-100 text-amber-800",
  positive: "bg-green-100 text-green-800",
  negative: "bg-red-100 text-red-800",
  neutral: "bg-stone-100 text-stone-700",
  outline: "border border-stone-300 bg-transparent text-stone-700",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
