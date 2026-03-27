import { format } from "date-fns";

export function dateToInputValue(d: Date | string | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
}

export function timeToInputValue(d: Date | string | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "HH:mm");
}

export function mergeDateAndTime(dateStr: string, timeStr: string): Date {
  // Return current date if inputs are incomplete
  if (!dateStr || !timeStr) return new Date();

  const dateParts = dateStr.split("-").map(Number);
  const timeParts = timeStr.split(":").map(Number);

  // Validate parts exist
  if (dateParts.length !== 3 || timeParts.length !== 2) return new Date();
  if (dateParts.some(isNaN) || timeParts.some(isNaN)) return new Date();

  const [y, mo, day] = dateParts;
  const [h, m] = timeParts;

  return new Date(y, mo - 1, day, h, m, 0);
}
