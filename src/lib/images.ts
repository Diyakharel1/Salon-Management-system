/**
 * Fallback images for salons.
 * Use index % length to cycle through placeholders.
 * Local salon images in public/salons/.
 */
export const SALON_PLACEHOLDERS = [
  "/salons/salon-1.webp",
  "/salons/salon-2.webp",
  "/salons/salon-3.webp",
  "/salons/salon-4.webp",
  "/salons/salon-5.webp",
  "/salons/salon-6.webp",
] as const;

export function getSalonImage(index: number): string {
  return SALON_PLACEHOLDERS[index % SALON_PLACEHOLDERS.length];
}

export const BRAND = {
  logo: "/brand/logo.svg",
  favicon: "/brand/favicon.svg",
} as const;

export const TRUSTED_LOGOS = [
  "/trusted/logo-1.svg",
  "/trusted/logo-2.svg",
  "/trusted/logo-3.svg",
  "/trusted/logo-4.svg",
  "/trusted/logo-5.svg",
] as const;
