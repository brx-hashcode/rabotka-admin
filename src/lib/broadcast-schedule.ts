import { format } from "date-fns";

/** The value format of `<input type="datetime-local">`, in local time. */
const LOCAL_INPUT = "yyyy-MM-dd'T'HH:mm";

export function toLocalInputValue(date: Date): string {
  return format(date, LOCAL_INPUT);
}

/**
 * The moment a `datetime-local` value stands for, or null when it cannot be
 * scheduled: empty, unparseable, or not in the future.
 *
 * The input has no timezone, so it is read in the browser's — the admin is
 * picking a time on their own clock, and the server is sent the instant.
 */
export function parseSchedule(value: string, now: Date = new Date()) {
  if (!value) return null;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return null;
  return at.getTime() > now.getTime() ? at : null;
}

/** "2 oct. 2026, 08:00" — for the button, the confirm dialog and the toast. */
export function formatSchedule(date: Date | string): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
