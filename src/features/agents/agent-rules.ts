import { z } from "zod";

import type {
  AgentCallOutcome,
  AgentCommissionStatus,
  AgentDocumentType,
  AgentKycCategory,
  AgentLeadStatus,
  AgentLedgerBucket,
  AgentMomoOperator,
  AgentMovement,
  AgentWithdrawalStatus,
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

// ── Leads & calls ───────────────────────────────────────────────────────────

/** The lead statuses an agent can hold, in the order they happen. */
export const LEAD_STATUSES: AgentLeadStatus[] = [
  "CLAIMED",
  "INVITED",
  "CONFIRMED",
  "DECLINED",
  "UNREACHABLE",
];

export const LEAD_STATUS_LABELS: Record<AgentLeadStatus, string> = {
  SUGGESTED: "Suggested",
  CLAIMED: "Calling",
  INVITED: "Invited",
  CONFIRMED: "Applied",
  DECLINED: "Declined",
  UNREACHABLE: "Unreachable",
};

/** Borderless tints: the badge sits on a card, not a table row. */
export function leadStatusBadgeClass(status: AgentLeadStatus): string {
  switch (status) {
    case "CLAIMED":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-transparent";
    case "INVITED":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-transparent";
    case "CONFIRMED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-transparent";
    case "DECLINED":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-transparent";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
}

export const CALL_OUTCOME_LABELS: Record<AgentCallOutcome, string> = {
  INTERESTED: "Interested",
  NOT_AVAILABLE: "Not available now",
  NOT_INTERESTED: "Not interested",
  UNREACHABLE: "No answer",
  WRONG_NUMBER: "Wrong number",
  CALL_BACK: "Call back",
};

/**
 * The four figures above an agent's leads. "In progress" is a worker still
 * being called or holding an invitation; "closed" is a no either way.
 */
export function leadTotals(counts: Partial<Record<AgentLeadStatus, number>>) {
  const n = (s: AgentLeadStatus) => counts[s] ?? 0;
  const inProgress = n("CLAIMED") + n("INVITED");
  const applied = n("CONFIRMED");
  const closed = n("DECLINED") + n("UNREACHABLE");
  const total = inProgress + applied + closed;
  return {
    total,
    inProgress,
    applied,
    closed,
    /** Share of finished leads that became an application; null before any. */
    conversion:
      applied + closed === 0 ? null : Math.round((applied / (applied + closed)) * 100),
  };
}

// ── Commissions ─────────────────────────────────────────────────────────────

export const COMMISSION_STATUS_LABELS: Record<AgentCommissionStatus, string> = {
  PENDING: "Waiting",
  AVAILABLE: "Withdrawable",
  CANCELLED: "Cancelled",
  INELIGIBLE: "Not paid",
};

export function commissionStatusBadgeClass(
  status: AgentCommissionStatus,
): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-transparent";
    case "AVAILABLE":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-transparent";
    case "CANCELLED":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-transparent";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
}

/**
 * Who may take a commission back. The server gates it at ADMIN; FINANCE
 * reaches ADMIN level inside the agents area, which it fully owns.
 */
export function canCancelAgentCommission(role: string | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "FINANCE";
}

/** Only money still on the books can be taken back. */
export function isCancellableCommission(status: AgentCommissionStatus): boolean {
  return status === "PENDING" || status === "AVAILABLE";
}

// ── Withdrawals ─────────────────────────────────────────────────────────────

export const WITHDRAWAL_STATUS_LABELS: Record<AgentWithdrawalStatus, string> = {
  REQUESTED: "To pay",
  PAID: "Paid",
  REJECTED: "Rejected",
};

export function withdrawalStatusBadgeClass(
  status: AgentWithdrawalStatus,
): string {
  switch (status) {
    case "REQUESTED":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-transparent";
    case "PAID":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-transparent";
    default:
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-transparent";
  }
}

export const MOMO_OPERATOR_LABELS: Record<AgentMomoOperator, string> = {
  MTN: "MTN Mobile Money",
  AIRTEL: "Airtel Money",
};

/** Network colours people recognise: MTN yellow, Airtel red. */
export function operatorBadgeClass(op: AgentMomoOperator): string {
  return op === "MTN"
    ? "bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 border-transparent"
    : "bg-red-500/10 text-red-700 dark:text-red-300 border-transparent";
}

/** A request waiting longer than this is flagged in the queue. */
export const WITHDRAWAL_OVERDUE_HOURS = 48;

/** How long since `iso`, short: "40 min", "5 h", "2 days". */
export function waitedFor(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(
    Math.floor((now.getTime() - new Date(iso).getTime()) / 60000),
    0,
  );
  if (minutes < 60) return `${Math.max(minutes, 1)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}

export function isOverdueWithdrawal(iso: string, now: Date = new Date()) {
  return now.getTime() - new Date(iso).getTime() > WITHDRAWAL_OVERDUE_HOURS * 3600_000;
}

/**
 * Who sees agents' withdrawals: MANAGER and above, and FINANCE (which owns
 * the payout page). MODERATOR and SUPPORT are refused by the server.
 */
export function canSeeAgentPayouts(role: string | undefined): boolean {
  return (
    role === "MANAGER" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "FINANCE"
  );
}

/** Who pays or rejects one — moving money, gated at ADMIN like a cancel. */
export const canProcessAgentWithdrawal = canCancelAgentCommission;

// ── Movements ───────────────────────────────────────────────────────────────

/** Bucket names as the wallet cards say them. */
export const BUCKET_LABELS: Record<AgentLedgerBucket, string> = {
  PENDING: "Waiting",
  AVAILABLE: "Available",
  LOCKED: "Requested",
  PAID_OUT: "Paid out",
};

const BUCKET_ORDER: AgentLedgerBucket[] = [
  "PENDING",
  "AVAILABLE",
  "LOCKED",
  "PAID_OUT",
];

/**
 * Where the money went, in words: "Waiting → Available", "→ Waiting" for new
 * money, "Waiting → removed" for money taken back.
 */
export function movementFlow(moves: AgentMovement["moves"]): string {
  const from = BUCKET_ORDER.filter((b) => (moves[b] ?? 0) < 0).map(
    (b) => BUCKET_LABELS[b],
  );
  const to = BUCKET_ORDER.filter((b) => (moves[b] ?? 0) > 0).map(
    (b) => BUCKET_LABELS[b],
  );
  if (from.length === 0) return `→ ${to.join(", ")}`;
  if (to.length === 0) return `${from.join(", ")} → removed`;
  return `${from.join(", ")} → ${to.join(", ")}`;
}

export type MovementTone = "gain" | "loss" | "neutral";

/**
 * How a movement reads from the agent's side. Earned and released money is a
 * gain; a cancelled commission a loss; a withdrawal only moves money the agent
 * already had — requested, paid or handed back.
 */
export function movementView(m: AgentMovement): {
  title: string;
  tone: MovementTone;
} {
  switch (m.kind) {
    case "COMMISSION_EARNED":
      return { title: "Commission earned", tone: "gain" };
    case "COMMISSION_RELEASED":
      return { title: "Commission now withdrawable", tone: "gain" };
    case "COMMISSION_CANCELLED":
      return { title: "Commission cancelled", tone: "loss" };
    case "WITHDRAWAL_REQUESTED":
      return { title: "Withdrawal requested", tone: "neutral" };
    case "WITHDRAWAL_PAID":
      return { title: "Withdrawal paid", tone: "neutral" };
    case "WITHDRAWAL_REJECTED":
      return { title: "Withdrawal rejected", tone: "neutral" };
    default: {
      const net = Object.values(m.moves).reduce((a, v) => a + (v ?? 0), 0);
      return {
        title: m.description ? `Adjustment — ${m.description}` : "Adjustment",
        tone: net > 0 ? "gain" : net < 0 ? "loss" : "neutral",
      };
    }
  }
}
