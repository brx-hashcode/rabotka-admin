import { describe, expect, it } from "vitest";

import type { AdminApplicationListItem } from "#/lib/api/applications-controller";
import {
  APPLICATION_EXPORT_HEADERS,
  applicationItemsToStringRows,
  applicationItemsToTypedRows,
} from "../application-export-rows";

const item: AdminApplicationListItem = {
  id: "a-1",
  jobTitle: "Plombier pour urgence",
  jobOfferId: "j-1",
  workerName: "Alice Dupont",
  workerEmail: "alice@mail.com",
  workerPhone: "+242065219464",
  workerAvatarUrl: null,
  workerId: "w-1",
  employerName: "Paul Kanda",
  employerEmail: "paul@mail.com",
  employerAvatarUrl: null,
  employerId: "e-1",
  status: "ACCEPTED",
  penaltyApplied: true,
  penaltyAmount: 2500,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: "2026-08-11T09:00:00.000Z",
  updatedAt: "2026-08-12T09:00:00.000Z",
};

const cell = (row: unknown[], header: string) =>
  row[APPLICATION_EXPORT_HEADERS.indexOf(header as never)];

describe("application export rows", () => {
  it("keeps headers and both row builders the same width", () => {
    expect(applicationItemsToStringRows([item])[0]).toHaveLength(
      APPLICATION_EXPORT_HEADERS.length,
    );
    expect(applicationItemsToTypedRows([item])[0]).toHaveLength(
      APPLICATION_EXPORT_HEADERS.length,
    );
  });

  /** Names and e-mails are not unique; these are what the analytics joins on. */
  it("exports the offer, worker and employer references", () => {
    for (const row of [
      applicationItemsToStringRows([item])[0]!,
      applicationItemsToTypedRows([item])[0]!,
    ]) {
      expect(cell(row, "Offer ID")).toBe("j-1");
      expect(cell(row, "Worker reference")).toBe("w-1");
      expect(cell(row, "Employer reference")).toBe("e-1");
    }
  });

  it("keeps the penalty amount numeric in the typed rows", () => {
    expect(cell(applicationItemsToTypedRows([item])[0]!, "Penalty amount")).toBe(2500);
    expect(cell(applicationItemsToStringRows([item])[0]!, "Penalty amount")).toBe("2500");
  });
});
