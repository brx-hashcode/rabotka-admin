import { describe, it, expect } from "vitest";
import { buildLabelLookup } from "#/features/wallet/components/mobile-money-sheet";
import type { PaymentGatewayMetadata } from "#/lib/api/wallet-controller";

const registry: PaymentGatewayMetadata[] = [
  {
    key: "MONETBIL",
    label: "Monetbil",
    requiresOperator: true,
    operators: [
      { code: "CG_MTNMOBILEMONEY", label: "MTN Mobile Money" },
      { code: "CG_AIRTELMONEY", label: "Airtel Money" },
    ],
  },
  {
    key: "MTN_MOMO",
    label: "MTN MoMo",
    requiresOperator: false,
    operators: [],
  },
];

describe("buildLabelLookup", () => {
  it("names gateways and operators from the backend registry", () => {
    // The point of the endpoint: adding a provider must not require shipping a
    // matching constant in this app.
    const labelFor = buildLabelLookup(registry);
    expect(labelFor("MONETBIL")).toBe("Monetbil");
    expect(labelFor("MTN_MOMO")).toBe("MTN MoMo");
    expect(labelFor("CG_AIRTELMONEY")).toBe("Airtel Money");
  });

  it("shows the raw key for a gateway this build no longer ships", () => {
    // Transactions keep the gateway they were paid through, so the admin still
    // renders rows whose gateway has left the registry. Blanking them would
    // make the money look like it came from nowhere.
    const labelFor = buildLabelLookup(registry);
    expect(labelFor("ORANGE_MONEY")).toBe("ORANGE_MONEY");
  });

  it("names the backend's placeholder for a transaction with no gateway", () => {
    const labelFor = buildLabelLookup(registry);
    expect(labelFor("UNKNOWN_GATEWAY")).toBe("Unknown");
    expect(labelFor("UNKNOWN_OPERATOR")).toBe("Unknown");
  });

  it("renders a dash for an absent value", () => {
    const labelFor = buildLabelLookup(registry);
    expect(labelFor(null)).toBe("—");
    expect(labelFor(undefined)).toBe("—");
    expect(labelFor("")).toBe("—");
  });

  it("still labels the placeholders before the registry has loaded", () => {
    // The query is lazy (`enabled: open`), so the first paint of the sheet has
    // no registry and must not crash or blank the column.
    const labelFor = buildLabelLookup(undefined);
    expect(labelFor("MONETBIL")).toBe("MONETBIL");
    expect(labelFor("UNKNOWN_GATEWAY")).toBe("Unknown");
  });
});
