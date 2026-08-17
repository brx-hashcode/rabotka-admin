import type { AdminJobOfferListItem } from "#/lib/api/jobs-controller";

/**
 * Everything the admin API knows about a mission, one row per mission.
 *
 * Beyond the Missions table's own columns, this carries what the offer led to:
 * applications by outcome, who was hired and how it ended, the paid contact
 * unlocks, the penalties it raised and the ratings it earned. A mission read
 * without those says what was asked for and never what came of it.
 *
 * Worker-level detail is deliberately not here — one row per application is
 * what the applications export is for.
 *
 * Must stay index-aligned with both row builders below.
 */
export const JOB_EXPORT_HEADERS = [
  // Identity
  "Reference",
  "Title",
  "Category",
  "Employment type",
  // Employer
  "Employer",
  "Employer email",
  "Employer phone",
  // Terms
  "Status",
  "Payment",
  "Amount",
  "Qty",
  // Location
  "Address",
  "City",
  "Country",
  "Remote",
  // Applications
  "Applications",
  "Pending",
  "Accepted",
  "Rejected",
  "Cancelled",
  // Hires
  "Hired",
  "Completed",
  "Cancelled assignments",
  "No-show",
  "Workers",
  // Contact unlocks
  "Unlock attempts",
  "Unlocked",
  "Employer paid unlocks",
  "Worker paid unlocks",
  "Unlock revenue",
  "Employer unlock paid",
  // Penalties and ratings
  "Penalties",
  "Unpaid penalties",
  "Penalty amount",
  "Rating average",
  "Rating count",
  // Timestamps and free text
  "Scheduled at (ISO)",
  "Created at (ISO)",
  "Updated at (ISO)",
  "Description",
  "Note",
] as const;

/**
 * Hired workers in a single cell, comma-separated.
 *
 * The same shape as the profiles export's `Domains`: the analytics engine reads
 * a comma-separated cell of short labels as a multi-value column and can then
 * rank the workers across every mission.
 */
const workers = (j: AdminJobOfferListItem) => (j.workerNames ?? []).join(", ");

const yesNo = (value: boolean) => (value ? "Yes" : "No");

export function jobItemsToStringRows(
  items: AdminJobOfferListItem[],
): string[][] {
  return items.map((j) => [
    j.reference ?? "",
    j.title ?? "",
    j.category?.name ?? "",
    j.employmentType ?? "",
    j.employerName ?? "",
    j.employerEmail ?? "",
    j.employerPhone ?? "",
    j.status ?? "",
    j.paymentFlow ?? "",
    j.amount == null ? "" : String(j.amount),
    String(j.quantity ?? ""),
    j.address ?? "",
    j.city ?? "",
    j.countryName ?? "",
    yesNo(j.isRemote),
    String(j.applicationsCount ?? 0),
    String(j.applicationsPending ?? 0),
    String(j.applicationsAccepted ?? 0),
    String(j.applicationsRejected ?? 0),
    String(j.applicationsCancelled ?? 0),
    String(j.hiredCount ?? 0),
    String(j.completedCount ?? 0),
    String(j.cancelledAssignmentsCount ?? 0),
    String(j.noShowCount ?? 0),
    workers(j),
    String(j.unlockAttempts ?? 0),
    String(j.unlocksCompleted ?? 0),
    String(j.unlockEmployerPaid ?? 0),
    String(j.unlockWorkerPaid ?? 0),
    String(j.unlockRevenue ?? 0),
    yesNo(j.employerUnlockPaid),
    String(j.penaltiesCount ?? 0),
    String(j.unpaidPenaltiesCount ?? 0),
    String(j.penaltiesAmount ?? 0),
    j.ratingAvg == null ? "" : String(j.ratingAvg),
    String(j.ratingCount ?? 0),
    j.scheduledAt ?? "",
    j.createdAt ?? "",
    j.updatedAt ?? "",
    j.description ?? "",
    j.note ?? "",
  ]);
}

/**
 * XLSX variant — numerics stay numeric so Excel can sort and aggregate them.
 *
 * `null` is passed through for a missing number rather than coerced to 0: an
 * unrated mission has no average, which is not the same as an average of zero.
 */
export function jobItemsToTypedRows(
  items: AdminJobOfferListItem[],
): (string | number | null)[][] {
  return items.map((j) => [
    j.reference ?? "",
    j.title ?? "",
    j.category?.name ?? "",
    j.employmentType ?? "",
    j.employerName ?? "",
    j.employerEmail ?? "",
    j.employerPhone ?? "",
    j.status ?? "",
    j.paymentFlow ?? "",
    j.amount,
    j.quantity ?? null,
    j.address ?? "",
    j.city ?? "",
    j.countryName ?? "",
    yesNo(j.isRemote),
    j.applicationsCount ?? 0,
    j.applicationsPending ?? 0,
    j.applicationsAccepted ?? 0,
    j.applicationsRejected ?? 0,
    j.applicationsCancelled ?? 0,
    j.hiredCount ?? 0,
    j.completedCount ?? 0,
    j.cancelledAssignmentsCount ?? 0,
    j.noShowCount ?? 0,
    workers(j),
    j.unlockAttempts ?? 0,
    j.unlocksCompleted ?? 0,
    j.unlockEmployerPaid ?? 0,
    j.unlockWorkerPaid ?? 0,
    j.unlockRevenue ?? 0,
    yesNo(j.employerUnlockPaid),
    j.penaltiesCount ?? 0,
    j.unpaidPenaltiesCount ?? 0,
    j.penaltiesAmount ?? 0,
    j.ratingAvg,
    j.ratingCount ?? 0,
    j.scheduledAt ?? "",
    j.createdAt ?? "",
    j.updatedAt ?? "",
    j.description ?? "",
    j.note ?? "",
  ]);
}
