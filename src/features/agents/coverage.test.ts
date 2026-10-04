import { describe, expect, it } from "vitest";

import { cityKey, congoCoverage } from "./coverage";

const zone = (city: string, agentIds: string[], countryCode = "CG") => ({
  countryCode,
  city,
  agentIds,
  agents: agentIds.length,
});

describe("congoCoverage", () => {
  it("places covered cities in their department, counting each agent once", () => {
    const c = congoCoverage([
      zone("Brazzaville", ["a1", "a2"]),
      zone("Pointe-Noire", ["a1"]),
      zone("Dolisie", ["a3"]),
      zone("Mossendjo", ["a3"]),
    ]);
    const dep = (name: string) => c.departments.find((d) => d.name === name);

    expect(dep("Brazzaville")).toEqual({ name: "Brazzaville", agents: 2, cities: 1 });
    // Dolisie and Mossendjo are both in Niari: one agent, two cities.
    expect(dep("Niari")).toEqual({ name: "Niari", agents: 1, cities: 2 });
    expect(dep("Likouala")?.agents).toBe(0);
    expect(c.agents).toBe(3);
    expect(c.departments).toHaveLength(12);
  });

  it("matches city names whatever their accents or case", () => {
    expect(cityKey("Bétou")).toBe(cityKey("BETOU"));
    const c = congoCoverage([zone("betou", ["a1"])]);
    expect(c.cities.map((x) => x.name)).toEqual(["Bétou"]);
  });

  it("keeps what cannot be drawn instead of dropping it", () => {
    const c = congoCoverage([
      zone("Achada Fatima", ["a1"]),
      zone("Kinshasa", ["a2"], "CD"),
    ]);
    expect(c.unplaced).toEqual([{ city: "Achada Fatima", agents: 1 }]);
    expect(c.elsewhere).toBe(1);
  });
});
