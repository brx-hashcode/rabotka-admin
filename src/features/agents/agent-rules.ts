import { z } from "zod";

import type {
  AgentDocumentType,
  AgentKycCategory,
  AgentStatus,
  AgentStatusAction,
  AgentZone,
} from "#/lib/api/agents-controller";

/**
 * Pure rules for the agents screens. Mirrors the backend's
 * `field-agent/agent-identity.ts` — the server re-checks every one of them, so
 * these exist to tell the admin BEFORE they submit, not to enforce anything.
 */

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  REVOKED: "Revoked",
};

export const agentStatusOptions = Object.entries(AGENT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function getAgentStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500 text-white border-transparent";
    case "SUSPENDED":
      return "bg-amber-500 text-white border-transparent";
    // Revoked is final, but not an error state — muted rather than red.
    case "REVOKED":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export const DOCUMENT_TYPE_OPTIONS: { value: AgentDocumentType; label: string }[] =
  [
    { value: "IDENTITY_CARD", label: "Identity Card" },
    { value: "PASSPORT", label: "Passport" },
    { value: "DRIVER_LICENSE", label: "Driver License" },
    { value: "NIU_CARD", label: "NIU Card" },
  ];

export const KYC_CATEGORY_LABELS: Record<AgentKycCategory, string> = {
  DOCUMENT: "ID — front",
  DOCUMENT_BACK: "ID — back",
  SELFIE: "Selfie holding the ID",
};

/**
 * The files a complete agent file needs. A passport carries everything on its
 * photo page, so it has no back — same rule as profile KYC.
 */
export function requiredKycCategories(
  documentType: AgentDocumentType,
): AgentKycCategory[] {
  return documentType === "PASSPORT"
    ? ["DOCUMENT", "SELFIE"]
    : ["DOCUMENT", "DOCUMENT_BACK", "SELFIE"];
}

/** Which required documents have no uploaded key yet. */
export function missingKycCategories(
  documentType: AgentDocumentType,
  keys: Partial<Record<AgentKycCategory, string>>,
): AgentKycCategory[] {
  return requiredKycCategories(documentType).filter((c) => !keys[c]);
}

/**
 * The documents to send for this type. A back uploaded before the admin
 * switched the type to Passport is dropped rather than sent — the server
 * would refuse it.
 */
export function kycRefsFor(
  documentType: AgentDocumentType,
  keys: Partial<Record<AgentKycCategory, string>>,
): { category: AgentKycCategory; key: string }[] {
  return requiredKycCategories(documentType)
    .filter((c) => keys[c])
    .map((c) => ({ category: c, key: keys[c]! }));
}

export function formatZones(zones: AgentZone[]): string {
  return zones.map((z) => z.city).join(", ");
}

/** What each status action is called, and whether it needs a reason. */
export const STATUS_ACTIONS: Record<
  AgentStatusAction,
  {
    label: string;
    /** Past tense, for the confirmation toast. */
    done: string;
    title: string;
    description: string;
    needsReason: boolean;
    destructive: boolean;
    from: AgentStatus[];
  }
> = {
  suspend: {
    label: "Suspend",
    done: "suspended",
    title: "Suspend this agent?",
    description:
      "They are signed out of the agent app on their next action and cannot sign in until reactivated.",
    needsReason: true,
    destructive: true,
    from: ["ACTIVE"],
  },
  reactivate: {
    label: "Reactivate",
    done: "reactivated",
    title: "Reactivate this agent?",
    description: "They can sign in to the agent app again straight away.",
    needsReason: false,
    destructive: false,
    from: ["SUSPENDED"],
  },
  revoke: {
    label: "Revoke",
    done: "revoked",
    title: "Revoke this agent?",
    description:
      "This ends the agency relationship for good. A revoked agent cannot be reactivated — you would have to create them again.",
    needsReason: true,
    destructive: true,
    from: ["ACTIVE", "SUSPENDED"],
  },
};

export function availableStatusActions(
  status: AgentStatus,
): AgentStatusAction[] {
  return (Object.keys(STATUS_ACTIONS) as AgentStatusAction[]).filter((a) =>
    STATUS_ACTIONS[a].from.includes(status),
  );
}

/** Same limits as the server's upload endpoints (admin-agent.controller). */
export const KYC_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
export const KYC_MAX_BYTES = 10 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Where a new zone row starts: nearly every agent works in Congo. */
export const DEFAULT_ZONE_COUNTRY = "CG";

export const emptyZone = (): AgentZone => ({
  countryCode: DEFAULT_ZONE_COUNTRY,
  city: "",
});

/**
 * The zone list of an agent form, for `useFieldArray`.
 *
 * At least one complete row, and no city twice — the server would collapse a
 * duplicate silently, so the admin is told instead. Errors land on the row
 * that is wrong (`zones.N.city`), or on the list for "none at all".
 */
export const zonesSchema = z
  .array(
    z.object({
      countryCode: z.string().length(2, "Choose a country"),
      city: z.string().min(1, "Choose a city"),
    }),
  )
  .min(1, "Add at least one city")
  .superRefine((zones, ctx) => {
    const seen = new Set<string>();
    zones.forEach((zone, index) => {
      if (!zone.city) return;
      const key = `${zone.countryCode}:${zone.city.toLowerCase()}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "city"],
          message: "Already in the list",
        });
      }
      seen.add(key);
    });
  });

/** Which camera a capture starts on: the back one for documents, front for faces. */
export function cameraFor(category: AgentKycCategory): "user" | "environment" {
  return category === "SELFIE" ? "user" : "environment";
}

export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

/**
 * Whether this admin may see an agent's money. The server gates the wallet at
 * MANAGER (lateral roles pass in their area), so a MODERATOR is refused.
 */
export function canSeeAgentWallet(role: string | undefined): boolean {
  return !!role && role !== "MODERATOR";
}

export const LEDGER_KIND_LABELS: Record<string, string> = {
  COMMISSION_EARNED: "Commission earned",
  COMMISSION_RELEASED: "Commission released",
  COMMISSION_CANCELLED: "Commission cancelled",
  WITHDRAWAL_REQUESTED: "Withdrawal requested",
  WITHDRAWAL_PAID: "Withdrawal paid",
  WITHDRAWAL_REJECTED: "Withdrawal rejected",
  ADJUSTMENT: "Adjustment",
};

export const LEDGER_BUCKET_LABELS: Record<string, string> = {
  PENDING: "Pending",
  AVAILABLE: "Available",
  LOCKED: "In withdrawal",
  PAID_OUT: "Paid out",
};

/** The `zone` query value for a city: its country, a colon, the stored city. */
export const zoneParam = (countryCode: string, city: string) =>
  `${countryCode}:${city}`;

/**
 * Options of the list's Country and City filters, built from the cities agents
 * actually cover — so every option returns somebody.
 *
 * Cities narrow to the selected countries (all cities when none is chosen),
 * and carry their country code: two countries can have a city of the same
 * name. Agent counts ride in the label, as a hint of where coverage is thin.
 */
export function zoneFilterOptions(
  zones: { countryCode: string; city: string; agents: number }[],
  countryName: (code: string) => string,
  selectedCountries: string[],
): {
  countries: { value: string; label: string }[];
  cities: { value: string; label: string }[];
} {
  const perCountry = new Map<string, number>();
  for (const z of zones) {
    perCountry.set(z.countryCode, (perCountry.get(z.countryCode) ?? 0) + z.agents);
  }
  const countries = [...perCountry.entries()]
    .map(([code, agents]) => ({
      value: code,
      label: `${countryName(code)} (${agents})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const cities = zones
    .filter(
      (z) =>
        selectedCountries.length === 0 ||
        selectedCountries.includes(z.countryCode),
    )
    .map((z) => ({
      value: zoneParam(z.countryCode, z.city),
      label: `${z.city}, ${z.countryCode} (${z.agents})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { countries, cities };
}
