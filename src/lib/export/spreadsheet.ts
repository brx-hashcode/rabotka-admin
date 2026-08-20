import * as XLSX from "xlsx";

/**
 * Characters Excel and Sheets treat as the start of a formula.
 *
 * `+` is the one that bites in practice: every phone number we export is E.164,
 * so `+242065219464` was being opened as the number 242065219464 with the plus
 * silently gone — on the column an admin is most likely to copy into a ticket.
 * `-` catches negative-looking values and `=`/`@` catch the injection case,
 * which is not hypothetical now that inbound WhatsApp bodies are exportable:
 * those are written by whoever messaged us.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/**
 * The apostrophe is the standard fix and it is a real trade-off: Excel and
 * Sheets consume it and show the original text, while a plain-text reader shows
 * it literally. A visible quote in `cat` beats a corrupted phone number in the
 * tool people actually open these with.
 *
 * XLSX needs none of this — `aoa_to_sheet` types a string as a text cell, never
 * a formula — so this guard is deliberately CSV-only.
 */
function csvEscapeCell(value: string): string {
  const guarded = FORMULA_LEAD.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(guarded)) {
    return `"${guarded.replaceAll('"', '""')}"`;
  }
  return guarded;
}

/** UTF-8 BOM so Excel recognizes encoding. */
export function rowsToCsvString(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(csvEscapeCell).join(","),
    ...rows.map((row) => row.map(csvEscapeCell).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadTextFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = globalThis.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildXlsxBlob(
  headers: string[],
  rows: (string | number | null)[][],
  sheetName: string,
): Blob {
  const safeName = sheetName
    .slice(0, 31)
    .replaceAll(":", "_")
    .replaceAll("\\", "_")
    .replaceAll("/", "_")
    .replaceAll("?", "_")
    .replaceAll("*", "_")
    .replaceAll("[", "_")
    .replaceAll("]", "_");
  const aoa: (string | number | null)[][] = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeName || "Sheet1");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
