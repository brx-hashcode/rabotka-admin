import { describe, expect, it } from "vitest";

import type { AdminJobCategory } from "#/lib/api/job-categories-controller";
import {
  CATEGORY_EXPORT_HEADERS,
  categoryItemsToStringRows,
  categoryItemsToTypedRows,
} from "../category-export-rows";

const busy: AdminJobCategory = {
  id: "c-1",
  name: "Aide à domicile",
  slug: "aide-domicile",
  description: "Assistance aux personnes âgées ou à mobilité réduite",
  icon: "🏠",
  created_at: "2026-06-15T00:00:00.000Z",
  jobOffersCount: 12,
  workersCount: 34,
};

/** A domain nobody uses — the row this export exists to surface. */
const dead: AdminJobCategory = {
  ...busy,
  id: "c-2",
  name: "Autre",
  slug: "autre",
  description: null,
  icon: null,
  jobOffersCount: 0,
  workersCount: 0,
};

const cell = (row: unknown[], header: string) =>
  row[CATEGORY_EXPORT_HEADERS.indexOf(header as never)];

describe("category export rows", () => {
  it("keeps headers and both row builders the same width", () => {
    expect(categoryItemsToStringRows([busy])[0]).toHaveLength(
      CATEGORY_EXPORT_HEADERS.length,
    );
    expect(categoryItemsToTypedRows([busy])[0]).toHaveLength(
      CATEGORY_EXPORT_HEADERS.length,
    );
  });

  it("carries the usage counts the cards cannot show", () => {
    const row = categoryItemsToStringRows([busy])[0];
    expect(cell(row, "Workers")).toBe("34");
    expect(cell(row, "Job offers")).toBe("12");
    expect(cell(row, "Name")).toBe("Aide à domicile");
  });

  /**
   * Zero is a real answer here and the most interesting one — an unused domain
   * is what someone runs this export to find. It must not come out blank.
   */
  it("writes zero counts as 0, not as an empty cell", () => {
    const row = categoryItemsToStringRows([dead])[0];
    expect(cell(row, "Workers")).toBe("0");
    expect(cell(row, "Job offers")).toBe("0");
    expect(cell(row, "Description")).toBe("");
  });

  it("keeps counts numeric in the xlsx variant so the sheet can sort by them", () => {
    const row = categoryItemsToTypedRows([busy])[0];
    expect(cell(row, "Workers")).toBe(34);
    expect(cell(row, "Job offers")).toBe(12);
  });

  it("has no duplicate header names", () => {
    const headers = [...CATEGORY_EXPORT_HEADERS];
    expect(headers).toHaveLength(new Set(headers).size);
  });
});
