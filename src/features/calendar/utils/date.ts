import { format } from "date-fns";

export function dateToInputValue(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function timeToInputValue(d: Date): string {
  return format(d, "HH:mm");
}

export function mergeDateAndTime(dateStr: string, timeStr: string): Date {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const [h, m] = timeStr.split(":").map(Number);
  return new Date(y, mo - 1, day, h, m, 0);
}
