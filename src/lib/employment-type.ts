/**
 * What kind of engagement a job offer is.
 *
 * Mirrors the backend `EmploymentType` enum, and the client's own copy at
 * `rabotka-client/src/lib/employment-type.ts`. The admin uses the raw enum
 * values rather than the French labels in most places, so only the pieces the
 * back office actually renders are duplicated here.
 */
export const EMPLOYMENT_TYPE_VALUES = [
  "MISSION",
  "CDD",
  "CDI",
  "STAGE",
] as const;

export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPE_VALUES)[number];

/**
 * The uppercase enum values themselves — identical to the client's map, so the
 * same offer never reads "Mission" in one surface and "MISSION" in the other.
 */
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentTypeValue, string> = {
  MISSION: "MISSION",
  CDD: "CDD",
  CDI: "CDI",
  STAGE: "STAGE",
};

/**
 * Only a one-off mission carries a closing date. A CDI, CDD or stage has no
 * date, so the column renders "—" and the form lets the field be cleared.
 */
export function requiresClosingDate(
  type: EmploymentTypeValue | string | null | undefined,
): boolean {
  return (type ?? "MISSION") === "MISSION";
}
