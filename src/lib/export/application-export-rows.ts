import type { AdminApplicationListItem } from "#/lib/api/applications-controller";

/**
 * Mirrors the Applications table columns, plus the contact details and the
 * penalty amount the table only hints at with a badge.
 *
 * The three references come last. They are what the analytics app joins on:
 * `Offer ID` to the missions export's `Offer ID`, the worker and employer
 * references to the profiles export's `Reference`. Names and e-mails are not
 * unique enough to join on.
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
  "Offer ID",
  "Worker reference",
  "Employer reference",
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
    a.jobOfferId ?? "",
    a.workerId ?? "",
    a.employerId ?? "",
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
    a.jobOfferId ?? "",
    a.workerId ?? "",
    a.employerId ?? "",
  ]);
}
