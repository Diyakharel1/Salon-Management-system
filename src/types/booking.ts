/** Booking status values used in DB and owner UI */
export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export function isBookingStatus(s: string): s is BookingStatus {
  return BOOKING_STATUSES.includes(s as BookingStatus);
}
