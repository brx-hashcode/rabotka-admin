import { describe, expect, it } from "vitest";

import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import {
  PROFILE_EXPORT_HEADERS,
  profileItemsToStringRows,
  profileItemsToTypedRows,
} from "../profile-export-rows";

/**
 * A fully populated profile. Every field is distinguishable so a misaligned
 * column shows up as the wrong value rather than as a coincidental match.
 */
const full: AdminProfileListItem = {
  id: "p-1",
  firstName: "Pregavi",
  lastName: "Nziozziami Bazy",
  email: "nziozziami@mail.com",
  phone: "+242065219464",
  address: "55 rue Ngampiema",
  countryCode: "CG",
  countryName: "Congo-Brazzaville",
  city: "Brazzaville",
  latitude: -4.2634,
  longitude: 15.2429,
  description: "Enseignant, hôtellerie",
  status: "ACTIVE",
  profileType: "WORKER",
  whatsappConnected: true,
  verificationStatus: "VERIFIED",
  verifiedBy: "Admin One",
  verifiedAt: "2026-08-01T10:00:00.000Z",
  rejectionReason: null,
  kycVerificationNote: "Pièce lisible",
  reliabilityScore: 100,
  avatarUrl: "https://example.test/a.jpg",
  createdAt: "2026-07-12T18:21:03.476Z",
  updatedAt: "2026-08-16T18:26:30.190Z",
  categoryIds: ["c-1", "c-2"],
  categoryNames: ["Cours particuliers", "Coiffure"],
  ratingAvg: 4.5,
  ratingCount: 2,
  billingStatus: "CLEAR",
  suspensionReason: null,
  suspendedAt: null,
  lastLoginAt: "2026-08-15T09:00:00.000Z",
  firstLogin: false,
  readAndApprovedPolicies: true,
  portfolioSlug: "pregavi-nziozziami-bazy-eca442",
  vectorIndexedAt: "2026-08-16T18:47:00.000Z",
  jobOffersCount: 0,
  applicationsCount: 3,
  penaltiesCount: 1,
  unpaidPenaltiesCount: 1,
};

/** Everything nullable actually null — the common case for a fresh signup. */
const sparse: AdminProfileListItem = {
  ...full,
  id: "p-2",
  countryCode: null,
  countryName: null,
  city: null,
  latitude: null,
  longitude: null,
  verifiedBy: null,
  verifiedAt: null,
  kycVerificationNote: null,
  reliabilityScore: null,
  avatarUrl: null,
  categoryIds: [],
  categoryNames: [],
  ratingAvg: null,
  suspensionReason: null,
  suspendedAt: null,
  lastLoginAt: null,
  portfolioSlug: null,
  vectorIndexedAt: null,
};

const cell = (row: unknown[], header: string) =>
  row[PROFILE_EXPORT_HEADERS.indexOf(header as never)];

describe("profile export rows", () => {
  /**
   * The headers and the two row builders are three parallel arrays. Nothing but
   * this test stops one gaining a field the others do not, which would shift
   * every later column by one and mislabel the whole export.
   */
  it("keeps headers and both row builders the same width", () => {
    expect(profileItemsToStringRows([full])[0]).toHaveLength(
      PROFILE_EXPORT_HEADERS.length,
    );
    expect(profileItemsToTypedRows([full])[0]).toHaveLength(
      PROFILE_EXPORT_HEADERS.length,
    );
  });

  it("exports the fields the old export dropped", () => {
    const row = profileItemsToStringRows([full])[0];
    expect(cell(row, "City")).toBe("Brazzaville");
    expect(cell(row, "Country")).toBe("Congo-Brazzaville");
    expect(cell(row, "Country code")).toBe("CG");
    expect(cell(row, "Description")).toBe("Enseignant, hôtellerie");
    expect(cell(row, "Domains")).toBe("Cours particuliers, Coiffure");
  });

  it("joins every domain rather than picking one", () => {
    const row = profileItemsToStringRows([full])[0];
    // A multi-skilled worker reduced to one trade reads as a specialist.
    expect(cell(row, "Domains")).toContain("Cours particuliers");
    expect(cell(row, "Domains")).toContain("Coiffure");
  });

  it("renders nulls as empty cells, never as the string 'null'", () => {
    const row = profileItemsToStringRows([sparse])[0];
    for (const value of row) {
      expect(value).not.toBe("null");
      expect(value).not.toBe("undefined");
      expect(typeof value).toBe("string");
    }
    expect(cell(row, "City")).toBe("");
    expect(cell(row, "Reliability score")).toBe("");
    expect(cell(row, "Domains")).toBe("");
  });

  /**
   * Excel aggregates the numeric columns, so a missing rating must stay null.
   * Coercing it to 0 would silently drag any average of the column down.
   */
  it("keeps numerics numeric in the xlsx variant and null when absent", () => {
    const row = profileItemsToTypedRows([full])[0];
    expect(cell(row, "Reliability score")).toBe(100);
    expect(cell(row, "Rating average")).toBe(4.5);
    expect(cell(row, "Latitude")).toBe(-4.2634);
    expect(cell(row, "Unpaid penalties")).toBe(1);

    const sparseRow = profileItemsToTypedRows([sparse])[0];
    expect(cell(sparseRow, "Rating average")).toBeNull();
    expect(cell(sparseRow, "Reliability score")).toBeNull();
    expect(cell(sparseRow, "Latitude")).toBeNull();
  });

  it("has no duplicate header names", () => {
    const headers = [...PROFILE_EXPORT_HEADERS];
    expect(headers).toHaveLength(new Set(headers).size);
  });

  /** Live payment URLs must not travel in a file that gets forwarded around. */
  it("does not export payment links", () => {
    const headers = PROFILE_EXPORT_HEADERS.join(" ").toLowerCase();
    expect(headers).not.toContain("payment link");
  });
});
