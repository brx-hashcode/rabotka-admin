import type { AgentCoveredZone } from "#/lib/api/agents-controller";
import { CONGO_CITIES, CONGO_DEPARTMENTS, type CongoCity } from "./congo-map-data";

/** Accent- and case-insensitive, so "Ouesso" and "OUESSO" or "Bétou"/"Betou" match. */
export function cityKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

const CITY_BY_KEY = new Map(CONGO_CITIES.map((c) => [cityKey(c.name), c]));

export type CongoCoverage = {
  /** Distinct agents covering each department; every department is present. */
  departments: { name: string; agents: number; cities: number }[];
  /** Covered Congo cities found on the map, with their agents. */
  cities: (CongoCity & { agents: number })[];
  /** Covered Congo zones whose city is not on the map. */
  unplaced: { city: string; agents: number }[];
  /** Distinct agents covering anywhere in Congo. */
  agents: number;
  /** Zones in other countries — not drawn, only counted. */
  elsewhere: number;
};

/**
 * Folds the covered zones into what the Congo map draws. An agent covering
 * two cities of one department counts once for that department.
 */
export function congoCoverage(zones: AgentCoveredZone[]): CongoCoverage {
  const byDepartment = new Map<string, { agents: Set<string>; cities: number }>(
    CONGO_DEPARTMENTS.map((d) => [d.name, { agents: new Set(), cities: 0 }]),
  );
  const cities: CongoCoverage["cities"] = [];
  const unplaced: CongoCoverage["unplaced"] = [];
  const congoAgents = new Set<string>();
  let elsewhere = 0;

  for (const zone of zones) {
    if (zone.countryCode !== "CG") {
      elsewhere += 1;
      continue;
    }
    zone.agentIds.forEach((id) => congoAgents.add(id));
    const city = CITY_BY_KEY.get(cityKey(zone.city));
    if (!city) {
      unplaced.push({ city: zone.city, agents: zone.agents });
      continue;
    }
    cities.push({ ...city, agents: zone.agents });
    const dep = byDepartment.get(city.department);
    if (dep) {
      zone.agentIds.forEach((id) => dep.agents.add(id));
      dep.cities += 1;
    }
  }

  return {
    departments: CONGO_DEPARTMENTS.map((d) => ({
      name: d.name,
      agents: byDepartment.get(d.name)?.agents.size ?? 0,
      cities: byDepartment.get(d.name)?.cities ?? 0,
    })),
    cities: cities.sort((a, b) => b.agents - a.agents),
    unplaced,
    agents: congoAgents.size,
    elsewhere,
  };
}
