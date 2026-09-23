import { describe, expect, it } from "vitest";

import { redactionSegments } from "../redaction-segments";
import type { AdminRedaction } from "#/lib/api/conversations-controller";

/** "appelle moi au 06 12 34 56 78" — the digits run from 15 to 29. */
const BODY = "appelle moi au 06 12 34 56 78";

const span = (start: number, end: number): AdminRedaction => ({
  start,
  end,
  category: "PHONE",
  matchedBy: "cg_mobile",
});

const joined = (body: string, spans: AdminRedaction[]) =>
  redactionSegments(body, spans)
    .map((s) => s.text)
    .join("");

describe("redactionSegments", () => {
  it("returns the whole body when nothing was withheld", () => {
    expect(redactionSegments(BODY, [])).toEqual([
      { text: BODY, withheld: false },
    ]);
  });

  it("cuts the withheld fragment out at the exact offsets", () => {
    const segments = redactionSegments(BODY, [span(15, 29)]);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual({ text: "appelle moi au ", withheld: false });
    expect(segments[1].text).toBe("06 12 34 56 78");
    expect(segments[1].withheld).toBe(true);
  });

  it("carries the category and the rule that fired, for the label", () => {
    // `matchedBy` is what lets somebody notice a bad pattern while reading,
    // rather than by running a query weeks later.
    const [, withheld] = redactionSegments(BODY, [span(15, 29)]);

    expect(withheld.category).toBe("PHONE");
    expect(withheld.matchedBy).toBe("cg_mobile");
  });

  it("handles a span at the very start", () => {
    const segments = redactionSegments("0612345678 salut", [span(0, 10)]);

    expect(segments[0].withheld).toBe(true);
    expect(segments[1]).toEqual({ text: " salut", withheld: false });
  });

  it("handles a span covering the whole body", () => {
    const segments = redactionSegments("0612345678", [span(0, 10)]);

    expect(segments).toHaveLength(1);
    expect(segments[0].withheld).toBe(true);
  });

  it("tolerates a span that runs past the end of the body", () => {
    // A row written before a pattern bug was fixed must not take a whole thread
    // down with it — this is the screen people open when something went wrong.
    expect(() => redactionSegments(BODY, [span(15, 9999)])).not.toThrow();
    expect(joined(BODY, [span(15, 9999)])).toBe(BODY);
  });

  it("ignores a span that is entirely out of range", () => {
    expect(redactionSegments(BODY, [span(500, 600)])).toEqual([
      { text: BODY, withheld: false },
    ]);
  });

  it("does not duplicate characters when spans overlap", () => {
    // The server merges overlaps before storing, but a backwards-emitting
    // segment would print the same digits twice on screen.
    expect(joined(BODY, [span(15, 25), span(20, 29)])).toBe(BODY);
  });

  it("keeps adjacent spans as two segments without losing text", () => {
    expect(joined(BODY, [span(15, 20), span(20, 29)])).toBe(BODY);
  });

  it("rejoins to the original body for every case", () => {
    // The invariant that catches every off-by-one at once.
    const cases: AdminRedaction[][] = [
      [],
      [span(0, 1)],
      [span(15, 29)],
      [span(0, BODY.length)],
      [span(3, 7), span(15, 29)],
    ];

    for (const spans of cases) expect(joined(BODY, spans)).toBe(BODY);
  });

  it("counts in UTF-16 units, so an emoji is two", () => {
    const body = "👍 0612345678";
    // The thumb occupies indices 0-1; the digits start at 3.
    expect(joined(body, [span(3, 13)])).toBe(body);
    expect(redactionSegments(body, [span(3, 13)])[1].text).toBe("0612345678");
  });
});
