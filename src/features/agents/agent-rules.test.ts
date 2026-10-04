import { describe, expect, it } from "vitest";

import {
  availableStatusActions,
  canCancelAgentCommission,
  canProcessAgentWithdrawal,
  canSeeAgentPayouts,
  isCancellableCommission,
  kycRefsFor,
  leadTotals,
  missingKycCategories,
  requiredKycCategories,
  zoneFilterOptions,
  zonesSchema,
} from "./agent-rules";

describe("agent identity documents", () => {
  it("needs no back for a passport, all three otherwise", () => {
    expect(requiredKycCategories("PASSPORT")).toEqual(["DOCUMENT", "SELFIE"]);
    expect(requiredKycCategories("IDENTITY_CARD")).toEqual([
      "DOCUMENT",
      "DOCUMENT_BACK",
      "SELFIE",
    ]);
  });

  it("lists what is still missing", () => {
    expect(
      missingKycCategories("IDENTITY_CARD", { DOCUMENT: "k1", SELFIE: "k3" }),
    ).toEqual(["DOCUMENT_BACK"]);
    expect(
      missingKycCategories("PASSPORT", { DOCUMENT: "k1", SELFIE: "k3" }),
    ).toEqual([]);
  });

  it("drops a back uploaded before switching to Passport", () => {
    // The server refuses a DOCUMENT_BACK for a passport.
    expect(
      kycRefsFor("PASSPORT", {
        DOCUMENT: "k1",
        DOCUMENT_BACK: "k2",
        SELFIE: "k3",
      }),
    ).toEqual([
      { category: "DOCUMENT", key: "k1" },
      { category: "SELFIE", key: "k3" },
    ]);
  });
});

describe("agent zones schema", () => {
  const bzv = { countryCode: "CG", city: "Brazzaville" };

  it("accepts complete, distinct rows", () => {
    const pnr = { countryCode: "CG", city: "Pointe-Noire" };
    expect(zonesSchema.safeParse([bzv, pnr]).success).toBe(true);
  });

  it("needs at least one city", () => {
    expect(zonesSchema.safeParse([]).success).toBe(false);
  });

  it("flags a row with no city on that row", () => {
    const result = zonesSchema.safeParse([bzv, { countryCode: "CG", city: "" }]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([1, "city"]);
  });

  it("flags the same city twice, whatever its case, on the second row", () => {
    const result = zonesSchema.safeParse([
      bzv,
      { countryCode: "CG", city: "brazzaville" },
    ]);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([1, "city"]);
  });

  it("keeps the same city name in two countries apart", () => {
    const other = { countryCode: "CD", city: "Brazzaville" };
    expect(zonesSchema.safeParse([bzv, other]).success).toBe(true);
  });
});

describe("agent status actions", () => {
  it("offers only legal moves, and nothing for a revoked agent", () => {
    expect(availableStatusActions("ACTIVE")).toEqual(["suspend", "revoke"]);
    expect(availableStatusActions("SUSPENDED")).toEqual([
      "reactivate",
      "revoke",
    ]);
    expect(availableStatusActions("REVOKED")).toEqual([]);
  });
});

describe("zone filter options", () => {
  const zones = [
    { countryCode: "CG", city: "Brazzaville", agents: 3 },
    { countryCode: "CG", city: "Pointe-Noire", agents: 1 },
    { countryCode: "CD", city: "Brazzaville", agents: 2 },
  ];
  const names: Record<string, string> = {
    CG: "Congo-Brazzaville",
    CD: "Congo-Kinshasa",
  };
  const name = (code: string) => names[code] ?? code;

  it("lists each covered country once, with its agent total", () => {
    expect(zoneFilterOptions(zones, name, []).countries).toEqual([
      { value: "CG", label: "Congo-Brazzaville (4)" },
      { value: "CD", label: "Congo-Kinshasa (2)" },
    ]);
  });

  it("keeps same-name cities in two countries apart", () => {
    const { cities } = zoneFilterOptions(zones, name, []);
    expect(cities.map((c) => c.value)).toEqual([
      "CD:Brazzaville",
      "CG:Brazzaville",
      "CG:Pointe-Noire",
    ]);
  });

  it("narrows cities to the selected countries", () => {
    const { cities } = zoneFilterOptions(zones, name, ["CG"]);
    expect(cities.map((c) => c.value)).toEqual([
      "CG:Brazzaville",
      "CG:Pointe-Noire",
    ]);
  });
});

describe("leadTotals", () => {
  it("groups statuses into in progress, applied and closed", () => {
    expect(
      leadTotals({ CLAIMED: 3, INVITED: 2, CONFIRMED: 4, DECLINED: 3, UNREACHABLE: 1 }),
    ).toEqual({ total: 13, inProgress: 5, applied: 4, closed: 4, conversion: 50 });
  });

  it("has no conversion before any lead is finished", () => {
    expect(leadTotals({ CLAIMED: 2 }).conversion).toBeNull();
    expect(leadTotals({}).total).toBe(0);
  });
});

describe("commission cancellation", () => {
  it("is for ADMIN and above, and FINANCE", () => {
    expect(canCancelAgentCommission("ADMIN")).toBe(true);
    expect(canCancelAgentCommission("SUPER_ADMIN")).toBe(true);
    expect(canCancelAgentCommission("FINANCE")).toBe(true);
    expect(canCancelAgentCommission("MANAGER")).toBe(false);
    expect(canCancelAgentCommission("SUPPORT")).toBe(false);
    expect(canCancelAgentCommission(undefined)).toBe(false);
  });

  it("only applies to money still on the books", () => {
    expect(isCancellableCommission("PENDING")).toBe(true);
    expect(isCancellableCommission("AVAILABLE")).toBe(true);
    expect(isCancellableCommission("CANCELLED")).toBe(false);
    expect(isCancellableCommission("INELIGIBLE")).toBe(false);
  });
});

describe("agent payouts", () => {
  it("are visible to MANAGER and above, and FINANCE", () => {
    for (const role of ["MANAGER", "ADMIN", "SUPER_ADMIN", "FINANCE"]) {
      expect(canSeeAgentPayouts(role)).toBe(true);
    }
    for (const role of ["MODERATOR", "SUPPORT", undefined]) {
      expect(canSeeAgentPayouts(role)).toBe(false);
    }
  });

  it("are paid or rejected by ADMIN and above, and FINANCE — not MANAGER", () => {
    expect(canProcessAgentWithdrawal("FINANCE")).toBe(true);
    expect(canProcessAgentWithdrawal("ADMIN")).toBe(true);
    expect(canProcessAgentWithdrawal("MANAGER")).toBe(false);
  });
});
