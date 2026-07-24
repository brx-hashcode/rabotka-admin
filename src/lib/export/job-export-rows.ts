import type { AdminJobOfferListItem } from "#/lib/api/jobs-controller";

/**
 * Mirrors the Missions table columns, plus the fields the table has no room
 * for but an export is expected to carry (employer contact, category,
 * address, description/note).
 */
export const JOB_EXPORT_HEADERS = [
  "Employer",
  "Employer email",
  "Employer phone",
  "Title",
  "Reference",
  "Category",
  "Status",
  "Payment",
  "Amount",
  "Qty",
  "Applications",
  "Address",
  "Scheduled at (ISO)",
  "Created at (ISO)",
  "Updated at (ISO)",
  "Description",
  "Note",
] as const;

export function jobItemsToStringRows(
  items: AdminJobOfferListItem[],
): string[][] {
  return items.map((j) => [
    j.employerName ?? "",
    j.employerEmail ?? "",
    j.employerPhone ?? "",
    j.title ?? "",
    j.reference ?? "",
    j.category?.name ?? "",
    j.status ?? "",
    j.paymentFlow ?? "",
    j.amount == null ? "" : String(j.amount),
    String(j.quantity ?? ""),
    String(j.applicationsCount ?? ""),
    j.address ?? "",
    j.scheduledAt ?? "",
    j.createdAt ?? "",
    j.updatedAt ?? "",
    j.description ?? "",
    j.note ?? "",
  ]);
}

export function jobItemsToTypedRows(
  items: AdminJobOfferListItem[],
): (string | number | null)[][] {
  return items.map((j) => [
    j.employerName ?? "",
    j.employerEmail ?? "",
    j.employerPhone ?? "",
    j.title ?? "",
    j.reference ?? "",
    j.category?.name ?? "",
    j.status ?? "",
    j.paymentFlow ?? "",
    // Numbers stay numeric so Excel can sum/sort them.
    j.amount,
    j.quantity ?? null,
    j.applicationsCount ?? null,
    j.address ?? "",
    j.scheduledAt ?? "",
    j.createdAt ?? "",
    j.updatedAt ?? "",
    j.description ?? "",
    j.note ?? "",
  ]);
}
