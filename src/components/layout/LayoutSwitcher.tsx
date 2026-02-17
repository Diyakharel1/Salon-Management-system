"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PublicLayout } from "./PublicLayout";

const pageTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};

export function LayoutSwitcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isOwner = pathname?.startsWith("/owner");

  const dashboardFallback = (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 8%, #fafaf9 25%, #fafaf9 100%)",
      }}
    >
      <div className="h-10 w-48 animate-pulse rounded-xl bg-amber-200/40" />
    </div>
  );

  if (isAdmin || isOwner) {
    return (
      <Suspense fallback={dashboardFallback}>
        {children}
      </Suspense>
    );
  }

  return (
    <PublicLayout>
      <motion.div key={pathname} {...pageTransition}>
        {children}
      </motion.div>
    </PublicLayout>
  );
}
