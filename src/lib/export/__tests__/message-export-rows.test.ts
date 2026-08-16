import { describe, expect, it } from "vitest";

import type { AdminProfileMessage } from "#/lib/api/profiles-controller";
import {
  MESSAGE_EXPORT_HEADERS,
  messageItemsToStringRows,
} from "../message-export-rows";

const PROFILE = "Rick Ollandzobo";

const msg = (over: Partial<AdminProfileMessage>): AdminProfileMessage => ({
  id: "m-1",
  direction: "INBOUND",
  platform: "WHATSAPP",
  body: "Bonjour",
  createdAt: "2026-08-16T10:00:00.000Z",
  sentByName: null,
  ...over,
});

const cell = (row: unknown[], header: string) =>
  row[MESSAGE_EXPORT_HEADERS.indexOf(header as never)];

describe("message export rows", () => {
  it("keeps headers and rows the same width", () => {
    expect(messageItemsToStringRows([msg({})], PROFILE)[0]).toHaveLength(
      MESSAGE_EXPORT_HEADERS.length,
    );
  });

  it("attributes inbound messages to the profile", () => {
    const row = messageItemsToStringRows([msg({})], PROFILE)[0];
    expect(cell(row, "Sender")).toBe(PROFILE);
    expect(cell(row, "Direction")).toBe("INBOUND");
  });

  it("attributes outbound messages to the admin who sent them", () => {
    const row = messageItemsToStringRows(
      [msg({ direction: "OUTBOUND", sentByName: "Fariol Blondeau" })],
      PROFILE,
    )[0];
    expect(cell(row, "Sender")).toBe("Fariol Blondeau");
  });

  /**
   * Automated sends have no author. Labelling them as staff would inflate any
   * measure of how much human support a user actually received.
   */
  it("labels automated outbound messages as System", () => {
    const row = messageItemsToStringRows(
      [msg({ direction: "OUTBOUND", sentByName: null })],
      PROFILE,
    )[0];
    expect(cell(row, "Sender")).toBe("System");
  });

  /** A conversation read out of order is not a conversation. */
  it("orders the thread oldest first regardless of input order", () => {
    const rows = messageItemsToStringRows(
      [
        msg({ id: "later", createdAt: "2026-08-16T12:00:00.000Z" }),
        msg({ id: "earlier", createdAt: "2026-08-16T09:00:00.000Z" }),
      ],
      PROFILE,
    );
    expect(rows.map((r) => cell(r, "Message ID"))).toEqual([
      "earlier",
      "later",
    ]);
  });

  /** The CSV writer quotes and escapes; flattening would destroy the shape. */
  it("preserves newlines in the message body", () => {
    const row = messageItemsToStringRows(
      [msg({ body: "Ligne 1\nLigne 2" })],
      PROFILE,
    )[0];
    expect(cell(row, "Message")).toBe("Ligne 1\nLigne 2");
  });

  it("has no duplicate header names", () => {
    const headers = [...MESSAGE_EXPORT_HEADERS];
    expect(headers).toHaveLength(new Set(headers).size);
  });
});
