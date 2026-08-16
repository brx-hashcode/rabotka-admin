import type { AdminJobCategory } from "#/lib/api/job-categories-controller";

/**
 * A domain and how much of the marketplace actually sits in it.
 *
 * The counts are the point of this export. The names and descriptions are
 * already visible on the cards; what the page cannot show is which domains are
 * carrying real supply and demand and which are dead weight — the question
 * behind pruning the list or deciding where to recruit.
 *
 * Must stay index-aligned with both row builders below.
 */
export const CATEGORY_EXPORT_HEADERS = [
  "ID",
  "Name",
  "Slug",
  "Description",
  "Icon",
  "Workers",
  "Job offers",
  "Created at (ISO)",
] as const;

export function categoryItemsToStringRows(
  items: AdminJobCategory[],
): string[][] {
  return items.map((c) => [
    c.id ?? "",
    c.name ?? "",
    c.slug ?? "",
    c.description ?? "",
    c.icon ?? "",
    String(c.workersCount ?? 0),
    String(c.jobOffersCount ?? 0),
    c.created_at ?? "",
  ]);
}

/**
 * XLSX variant — the two counts stay numeric so the sheet can sort by them,
 * which is the first thing anyone does with this file.
 */
export function categoryItemsToTypedRows(
  items: AdminJobCategory[],
): (string | number | null)[][] {
  return items.map((c) => [
    c.id ?? "",
    c.name ?? "",
    c.slug ?? "",
    c.description ?? "",
    c.icon ?? "",
    c.workersCount ?? 0,
    c.jobOffersCount ?? 0,
    c.created_at ?? "",
  ]);
}
