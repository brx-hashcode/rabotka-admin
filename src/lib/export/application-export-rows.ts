import type { AdminApplicationListItem } from "#/lib/api/applications-controller";

/**
 * Mirrors the Applications table columns, plus the contact details and the
 * penalty amount the table only hints at with a badge.
 */
export const APPLICATION_EXPORT_HEADERS = [
  "Employer",
  "Employer email",
  "Worker",
  "Worker email",
  "Worker phone",
  "Job",
  "Status",
  "Penalty applied",
  "Penalty amount",
  "Cancel reason",
  "Cancelled at",
  "Created at",
  "Updated at",
] as const;

export function applicationItemsToStringRows(
  items: AdminApplicationListItem[],
): string[][] {
  return items.map((a) => [
    a.employerName ?? "",
    a.employerEmail ?? "",
    a.workerName ?? "",
    a.workerEmail ?? "",
    a.workerPhone ?? "",
    a.jobTitle ?? "",
    a.status ?? "",
    a.penaltyApplied ? "Yes" : "No",
    a.penaltyAmount == null ? "" : String(a.penaltyAmount),
    a.cancellationReason ?? "",
    a.cancelledAt ?? "",
    a.createdAt ?? "",
    a.updatedAt ?? "",
  ]);
}

export function applicationItemsToTypedRows(
  items: AdminApplicationListItem[],
): (string | number | null)[][] {
  return items.map((a) => [
    a.employerName ?? "",
    a.employerEmail ?? "",
    a.workerName ?? "",
    a.workerEmail ?? "",
    a.workerPhone ?? "",
    a.jobTitle ?? "",
    a.status ?? "",
    a.penaltyApplied ? "Yes" : "No",
    // Numeric so Excel can sum penalties.
    a.penaltyAmount,
    a.cancellationReason ?? "",
    a.cancelledAt ?? "",
    a.createdAt ?? "",
    a.updatedAt ?? "",
  ]);
}
