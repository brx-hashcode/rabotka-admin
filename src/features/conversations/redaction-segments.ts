import type { AdminRedaction } from "#/lib/api/conversations-controller";

export type Segment = {
  text: string;
  /** Withheld from the recipient. The admin sees it; they never did. */
  withheld: boolean;
  /** Present only on a withheld segment, to label the highlight. */
  category?: AdminRedaction["category"];
  matchedBy?: string;
};

/**
 * Splits a raw message around the fragments that were withheld.
 *
 * Ported from `rabotka-client/src/features/discussions/redaction-segments.ts`,
 * which splits the same offsets for the message's author. Same arithmetic,
 * OPPOSITE MEANING — and the renderer has to follow the meaning, not the shape:
 *
 * - In the client, a segment is the author's own text struck through: "this did
 *   not go out". A subtractive gesture about words the reader wrote.
 * - Here, a segment is text the recipient NEVER SAW, highlighted: "look here".
 *   An additive gesture pointing at evidence.
 *
 * Striking it through in the admin would read as "this text is void", which is
 * exactly backwards — it is the only text on the screen that matters.
 *
 * Unlike the client's, this is never gated on authorship: the admin gets
 * offsets for every message, not just their own, because they wrote none of them.
 *
 * Offsets are UTF-16 indices into `body`, the units `String.slice` uses, so they
 * apply directly. The database holds them under a CHECK constraint, but this
 * still tolerates a span that falls outside the body rather than throwing. A row
 * written before a pattern bug was fixed must not take a whole thread down with
 * it — and this is the screen people open precisely when something has gone
 * wrong.
 */
export function redactionSegments(
  body: string,
  redactions: readonly AdminRedaction[],
): Segment[] {
  if (redactions.length === 0) return [{ text: body, withheld: false }];

  const clamped = redactions
    .map((span) => ({
      start: Math.max(0, Math.min(span.start, body.length)),
      end: Math.max(0, Math.min(span.end, body.length)),
      category: span.category,
      matchedBy: span.matchedBy,
    }))
    .filter((span) => span.end > span.start)
    .sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;

  for (const span of clamped) {
    // Overlapping spans should not exist — the server merges them before
    // storing — but a span that starts behind the cursor must not emit
    // backwards text, which would duplicate characters on screen.
    if (span.end <= cursor) continue;
    const start = Math.max(span.start, cursor);

    if (start > cursor) {
      out.push({ text: body.slice(cursor, start), withheld: false });
    }
    out.push({
      text: body.slice(start, span.end),
      withheld: true,
      category: span.category,
      matchedBy: span.matchedBy,
    });
    cursor = span.end;
  }

  if (cursor < body.length) {
    out.push({ text: body.slice(cursor), withheld: false });
  }
  return out;
}
