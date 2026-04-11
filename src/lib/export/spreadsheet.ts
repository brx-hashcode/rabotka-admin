import * as XLSX from "xlsx";

function csvEscapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
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
