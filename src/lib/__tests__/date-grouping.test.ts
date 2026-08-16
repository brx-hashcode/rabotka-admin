import { describe, expect, it } from "vitest";

import { groupByDay } from "../date-grouping";

const at = (iso: string) => ({ id: iso, createdAt: iso });

describe("groupByDay", () => {
  it("buckets records that share a calendar day", () => {
    const groups = groupByDay(
      [
        at("2026-08-13T22:00:00.000Z"),
        at("2026-08-13T08:00:00.000Z"),
        at("2026-08-08T09:34:00.000Z"),
      ],
      (r) => r.createdAt,
    );
    expect(groups).toHaveLength(2);
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].items).toHaveLength(1);
  });

  /**
   * A heading appearing twice is the failure this prevents: the panels feed it
   * whatever order the API returned, and an unsorted input would split one day
   * into two sections further apart in the list.
   */
  it("sorts newest first regardless of input order, so a day cannot repeat", () => {
    const groups = groupByDay(
      [
        at("2026-08-08T09:00:00.000Z"),
        at("2026-08-13T09:00:00.000Z"),
        at("2026-08-08T18:00:00.000Z"),
      ],
      (r) => r.createdAt,
    );
    expect(groups.map((g) => g.key)).toEqual(["2026-08-13", "2026-08-08"]);
    expect(new Set(groups.map((g) => g.key)).size).toBe(groups.length);
  });

  it("orders items inside a day newest first", () => {
    const groups = groupByDay(
      [at("2026-08-13T08:00:00.000Z"), at("2026-08-13T22:00:00.000Z")],
      (r) => r.createdAt,
    );
    expect(groups[0].items.map((i) => i.id)).toEqual([
      "2026-08-13T22:00:00.000Z",
      "2026-08-13T08:00:00.000Z",
    ]);
  });

  /** An "Invalid Date" heading is worse than the row not being there. */
  it("drops records with an unparseable date", () => {
    const groups = groupByDay(
      [at("not-a-date"), at("2026-08-13T09:00:00.000Z")],
      (r) => r.createdAt,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(1);
  });

  it("returns nothing for an empty list", () => {
    expect(groupByDay([], (r: { createdAt: string }) => r.createdAt)).toEqual(
      [],
    );
  });

  it("labels today and yesterday relatively, older days absolutely", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const groups = groupByDay(
      [
        { createdAt: now.toISOString() },
        { createdAt: yesterday.toISOString() },
        { createdAt: "2026-01-05T09:00:00.000Z" },
      ],
      (r) => r.createdAt,
    );
    const headings = groups.map((g) => g.heading);
    expect(headings).toContain("Today");
    expect(headings).toContain("Yesterday");
    // Older than that reads as a date; making the reader compute "218 days ago"
    // is exactly what a heading should save them.
    expect(headings.some((h) => h.includes("2026"))).toBe(true);
  });
});
