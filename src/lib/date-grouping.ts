import { format, isToday, isYesterday } from "date-fns";

/**
 * "Today" / "Yesterday" / a full date — the heading a day's rows sit under.
 *
 * Relative for the two days anyone reads without thinking, absolute after that:
 * "3 days ago" as a heading forces the reader to do the arithmetic that a date
 * would have saved them.
 */
export function dayHeading(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMMM yyyy");
}

export type DayGroup<T> = {
  /** `yyyy-MM-dd`, stable across renders — safe as a React key. */
  key: string;
  heading: string;
  items: T[];
};

/**
 * Buckets records into calendar days, newest day first.
 *
 * Exists because the admin's three history panels — activity, wallet, invoices —
 * all show the same shape: long runs of the same event on the same day, which
 * read as one thing repeated until a date separates them.
 *
 * Sorts internally rather than trusting the caller's order, so a day heading can
 * never appear twice in one list. Records with an unparseable date are dropped:
 * they cannot be placed on a timeline, and a "Invalid Date" heading is worse
 * than an omission.
 */
export function groupByDay<T>(
  items: T[],
  getDate: (item: T) => string | Date,
): DayGroup<T>[] {
  const groups = new Map<string, DayGroup<T>>();

  const dated = items
    .map((item) => ({ item, date: new Date(getDate(item)) }))
    .filter(({ date }) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const { item, date } of dated) {
    const key = format(date, "yyyy-MM-dd");
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { key, heading: dayHeading(date), items: [item] });
    }
  }

  return [...groups.values()];
}
