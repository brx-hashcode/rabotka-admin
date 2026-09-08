import { describe, expect, it } from "vitest";

import type { AdminJobOfferListItem } from "#/lib/api/jobs-controller";
import {
  JOB_EXPORT_HEADERS,
  jobItemsToStringRows,
  jobItemsToTypedRows,
} from "../job-export-rows";

/**
 * A mission that had a full life: applications in every state, two hires, paid
 * unlocks, penalties, ratings. Every count is a different number so a misaligned
 * column shows up as the wrong value rather than as a coincidental match.
 */
const full: AdminJobOfferListItem = {
  id: "j-1",
  reference: "RBK-2026-0042",
  title: "Plombier pour urgence",
  category: { id: "c-1", name: "Plomberie" },
  description: "Réparation fuite eau cuisine",
  employmentType: "MISSION",
  scheduledAt: "2026-08-20T08:00:00.000Z",
  amount: 15000,
  paymentFlow: "DAILY",
  address: "123 Avenue de la Paix, Poto-Poto",
  isRemote: false,
  countryCode: "CG",
  countryName: "Congo-Brazzaville",
  city: "Brazzaville",
  note: "Prévoir outillage",
  quantity: 2,
  status: "COMPLETED",
  employerName: "Paul Kanda",
  employerEmail: "paul@mail.com",
  employerPhone: "+242065219464",
  employerAvatarUrl: null,
  employerId: "e-1",
  applicationsCount: 9,
  createdAt: "2026-08-10T10:00:00.000Z",
  updatedAt: "2026-08-21T12:00:00.000Z",
  vectorIndexedAt: "2026-08-10T10:05:00.000Z",
  applicationsPending: 4,
  applicationsAccepted: 2,
  applicationsRejected: 2,
  applicationsCancelled: 1,
  hiredCount: 2,
  completedCount: 1,
  cancelledAssignmentsCount: 1,
  noShowCount: 3,
  workerNames: ["Alice Dupont", "Jean Mabiala"],
  unlockAttempts: 5,
  unlocksCompleted: 3,
  unlockEmployerPaid: 4,
  unlockWorkerPaid: 3,
  unlockRevenue: 2600,
  employerUnlockPaid: true,
  penaltiesCount: 6,
  unpaidPenaltiesCount: 2,
  penaltiesAmount: 3500,
  ratingAvg: 4.5,
  ratingCount: 7,
};

/** A mission just published: nothing has happened to it yet. */
const fresh: AdminJobOfferListItem = {
  ...full,
  id: "j-2",
  reference: "RBK-2026-0043",
  category: null,
  scheduledAt: null,
  amount: null,
  paymentFlow: null,
  address: null,
  isRemote: true,
  countryCode: null,
  countryName: null,
  city: null,
  note: null,
  status: "ACTIVE",
  applicationsCount: 0,
  vectorIndexedAt: null,
  applicationsPending: 0,
  applicationsAccepted: 0,
  applicationsRejected: 0,
  applicationsCancelled: 0,
  hiredCount: 0,
  completedCount: 0,
  cancelledAssignmentsCount: 0,
  noShowCount: 0,
  workerNames: [],
  unlockAttempts: 0,
  unlocksCompleted: 0,
  unlockEmployerPaid: 0,
  unlockWorkerPaid: 0,
  unlockRevenue: 0,
  employerUnlockPaid: false,
  penaltiesCount: 0,
  unpaidPenaltiesCount: 0,
  penaltiesAmount: 0,
  ratingAvg: null,
  ratingCount: 0,
};

const cell = (row: unknown[], header: string) =>
  row[JOB_EXPORT_HEADERS.indexOf(header as never)];

describe("job export rows", () => {
  /**
   * The headers and the two row builders are three parallel arrays. Nothing but
   * this test stops one gaining a field the others do not, which would shift
   * every later column by one and mislabel the whole export.
   */
  it("keeps headers and both row builders the same width", () => {
    expect(jobItemsToStringRows([full])[0]).toHaveLength(
      JOB_EXPORT_HEADERS.length,
    );
    expect(jobItemsToTypedRows([full])[0]).toHaveLength(
      JOB_EXPORT_HEADERS.length,
    );
  });

  it("exports what became of the mission", () => {
    const row = jobItemsToStringRows([full])[0]!;
    expect(cell(row, "Applications")).toBe("9");
    expect(cell(row, "Pending")).toBe("4");
    expect(cell(row, "Accepted")).toBe("2");
    expect(cell(row, "Rejected")).toBe("2");
    expect(cell(row, "Cancelled")).toBe("1");
    expect(cell(row, "Hired")).toBe("2");
    expect(cell(row, "Completed")).toBe("1");
    expect(cell(row, "Cancelled assignments")).toBe("1");
    expect(cell(row, "No-show")).toBe("3");
    expect(cell(row, "Unlock attempts")).toBe("5");
    expect(cell(row, "Unlocked")).toBe("3");
    expect(cell(row, "Unlock revenue")).toBe("2600");
    expect(cell(row, "Penalties")).toBe("6");
    expect(cell(row, "Unpaid penalties")).toBe("2");
    expect(cell(row, "Penalty amount")).toBe("3500");
    expect(cell(row, "Rating average")).toBe("4.5");
    expect(cell(row, "Rating count")).toBe("7");
  });

  /**
   * The analytics engine reads a comma-separated cell of short labels as a
   * multi-value column, which is what lets it rank workers across missions.
   */
  it("joins hired workers into one comma-separated cell", () => {
    const row = jobItemsToStringRows([full])[0]!;
    expect(cell(row, "Workers")).toBe("Alice Dupont, Jean Mabiala");
    expect(cell(jobItemsToStringRows([fresh])[0]!, "Workers")).toBe("");
  });

  it("exports the location and employment fields the old export dropped", () => {
    const row = jobItemsToStringRows([full])[0]!;
    expect(cell(row, "City")).toBe("Brazzaville");
    expect(cell(row, "Country")).toBe("Congo-Brazzaville");
    expect(cell(row, "Employment type")).toBe("MISSION");
    expect(cell(row, "Remote")).toBe("No");
    expect(cell(jobItemsToStringRows([fresh])[0]!, "Remote")).toBe("Yes");
  });

  it("leaves an unrated mission's average empty rather than zero", () => {
    // Zero would read as "rated badly"; empty reads as "not rated".
    expect(cell(jobItemsToStringRows([fresh])[0]!, "Rating average")).toBe("");
    expect(cell(jobItemsToTypedRows([fresh])[0]!, "Rating average")).toBeNull();
  });

  it("keeps numbers numeric in the typed rows so Excel can sum them", () => {
    const row = jobItemsToTypedRows([full])[0]!;
    expect(cell(row, "Amount")).toBe(15000);
    expect(cell(row, "Applications")).toBe(9);
    expect(cell(row, "Unlock revenue")).toBe(2600);
    expect(cell(row, "Penalty amount")).toBe(3500);
  });
});
