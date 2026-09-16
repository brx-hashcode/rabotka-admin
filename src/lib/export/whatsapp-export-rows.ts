import type { WhatsappMessageItem } from "#/lib/api/whatsapp-controller";

/**
 * Every message the delivery log holds, one row per message.
 *
 * The table on screen shows eight columns; this carries all twenty-four the API
 * returns, plus one derived. That is the same trade the other exports make: the
 * table is for scanning, the export is for answering questions afterwards —
 * which template was billed as what, how long delivery took, which error code
 * Meta returned.
 *
 * Two columns need their reason written down:
 *
 * - `Message details` is not decoration. When a send had no rendered body the
 *   log stores the literal `[TPL:kyc_v3]`, and the variables are then the only
 *   record of what the recipient actually read.
 * - `Content` is capped at 2000 characters and always was — the backend
 *   truncates at write time and never stores the full body, so no export can
 *   recover it. The header says so rather than implying completeness.
 *
 * Must stay index-aligned with both row builders below.
 */
export const WHATSAPP_EXPORT_HEADERS = [
  // When and which way
  "Created at",
  "Direction",
  // Who
  "Recipient phone",
  "Profile name",
  "Profile reference",
  // What was sent
  "Type",
  "Approved message",
  "Message category",
  "Billed as",
  "Paid message",
  "Content (first 2000 characters)",
  "Message details",
  // What happened to it
  "Status",
  "Sent at",
  "Delivered at",
  "Read at",
  "Failed at",
  "Time to delivery (seconds)",
  // Why it failed
  "Problem",
  "WhatsApp error number",
  "What WhatsApp said",
  // Provenance
  "Sent through",
  "Sent by",
  "WhatsApp reference",
  "Message reference",
] as const;

/**
 * Compact JSON in a single cell.
 *
 * `null` and `{}` both render empty: an empty object is noise that reads as
 * data. Deliberately not flattened into one column per key — key sets differ
 * per template, and a variable-width export breaks the header tuple this file
 * is built on.
 */
function variablesCell(value: Record<string, unknown> | null): string {
  if (!value || Object.keys(value).length === 0) return "";
  return JSON.stringify(value);
}

/**
 * Three states, and the third is why this cannot reuse `yesNo`.
 *
 * `null` means Meta has not told us whether it charged for this message yet.
 * Rendering that as "No" would assert we were not billed, which is a different
 * claim and sometimes a false one.
 */
function billableCell(value: boolean | null): string {
  if (value === null) return "";
  return value ? "Yes" : "No";
}

/**
 * Seconds between handing the message to the provider and the handset
 * acknowledging it, or null when either end is missing.
 *
 * Derived here rather than left to the reader because both operands are ISO
 * *text* in the sheet, and subtracting two text timestamps is the one thing
 * spreadsheets are worst at.
 */
function deliverySeconds(item: WhatsappMessageItem): number | null {
  if (!item.sentAt || !item.deliveredAt) return null;
  const ms = new Date(item.deliveredAt).getTime() - new Date(item.sentAt).getTime();
  return Number.isFinite(ms) ? Math.round(ms / 1000) : null;
}

/** CSV: every cell a string, nulls as empty. */
export function whatsappItemsToStringRows(
  items: WhatsappMessageItem[],
): string[][] {
  return items.map((item) => {
    const seconds = deliverySeconds(item);
    return [
      item.createdAt,
      item.direction,
      item.toPhone,
      item.profileName ?? "",
      item.profileId ?? "",
      item.kind,
      item.templateKey ?? "",
      item.templateCategory ?? "",
      item.pricingCategory ?? "",
      billableCell(item.billable),
      item.bodyPreview,
      variablesCell(item.variables),
      item.status,
      item.sentAt ?? "",
      item.deliveredAt ?? "",
      item.readAt ?? "",
      item.failedAt ?? "",
      seconds === null ? "" : String(seconds),
      item.errorCode ?? "",
      item.errorProviderCode === null ? "" : String(item.errorProviderCode),
      item.errorMessage ?? "",
      item.provider,
      item.sentByName ?? "",
      item.providerMessageId ?? "",
      item.id,
    ];
  });
}

/**
 * XLSX: numbers stay numeric and absent values stay null.
 *
 * `null` rather than `""` so a missing timestamp is a blank cell rather than an
 * empty string, and `errorProviderCode` stays a number so 131047 sorts before
 * 132000 instead of lexicographically.
 *
 * Timestamps are the raw ISO strings, not Dates: Excel then stores text and
 * performs no timezone reinterpretation of its own.
 */
export function whatsappItemsToTypedRows(
  items: WhatsappMessageItem[],
): (string | number | null)[][] {
  return items.map((item) => [
    item.createdAt,
    item.direction,
    item.toPhone,
    item.profileName ?? "",
    item.profileId ?? "",
    item.kind,
    item.templateKey ?? "",
    item.templateCategory ?? "",
    item.pricingCategory ?? "",
    billableCell(item.billable),
    item.bodyPreview,
    variablesCell(item.variables),
    item.status,
    item.sentAt ?? null,
    item.deliveredAt ?? null,
    item.readAt ?? null,
    item.failedAt ?? null,
    deliverySeconds(item),
    item.errorCode ?? "",
    item.errorProviderCode ?? null,
    item.errorMessage ?? "",
    item.provider,
    item.sentByName ?? "",
    item.providerMessageId ?? "",
    item.id,
  ]);
}
