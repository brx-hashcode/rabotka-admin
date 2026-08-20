import { describe, expect, it } from "vitest";
import { rowsToCsvString } from "#/lib/export/spreadsheet";

/**
 * The formula guard, which exists because of one concrete failure: E.164 phone
 * numbers start with `+`, and Excel read that as a formula and dropped it.
 */
describe("rowsToCsvString", () => {
  const cellsOf = (csv: string) =>
    csv.replace("﻿", "").split("\r\n").map((line) => line.split(","));

  it("keeps a leading + so Excel does not eat the phone number", () => {
    const csv = rowsToCsvString(["Phone"], [["+242065219464"]]);
    expect(cellsOf(csv)[1][0]).toBe("'+242065219464");
  });

  it("neutralises a formula sent in by an inbound message", () => {
    const csv = rowsToCsvString(
      ["Content"],
      [['=HYPERLINK("http://evil","click")']],
    );
    const cell = cellsOf(csv)[1].join(",");
    // Quoted because it contains a comma and quotes; the point is that it no
    // longer STARTS with `=`.
    expect(cell.startsWith('"=')).toBe(false);
    expect(cell).toContain("'=HYPERLINK");
  });

  it.each(["=", "+", "-", "@"])("guards a leading %s", (lead) => {
    const csv = rowsToCsvString(["X"], [[`${lead}danger`]]);
    expect(cellsOf(csv)[1][0]).toBe(`'${lead}danger`);
  });

  it("leaves ordinary values untouched", () => {
    const csv = rowsToCsvString(
      ["Name", "Amount", "Status"],
      [["Alice", "25000", "DELIVERED"]],
    );
    expect(cellsOf(csv)[1]).toEqual(["Alice", "25000", "DELIVERED"]);
  });

  it("does not guard a plus that is not leading", () => {
    const csv = rowsToCsvString(["X"], [["a+b"]]);
    expect(cellsOf(csv)[1][0]).toBe("a+b");
  });

  it("still quotes commas, quotes and newlines", () => {
    const csv = rowsToCsvString(["X"], [['say "hi", now\nagain']]);
    expect(csv).toContain('"say ""hi"", now\nagain"');
  });

  it("keeps the BOM first so Excel detects UTF-8", () => {
    expect(rowsToCsvString(["X"], [["+1"]]).startsWith("﻿")).toBe(true);
  });
});
