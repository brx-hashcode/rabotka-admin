import type {
  OAuthAppRequest,
  PartnerApiCallKind,
} from "#/lib/api/oauth-apps-controller";

/** What each partner call is, in plain words. */
export const CALL_LABELS: Record<PartnerApiCallKind, string> = {
  TOKEN: "Sign-in completed",
  USERINFO: "Profile details read",
  REVOKE: "Sign-in cancelled by the app",
  IDENTITY_CHECK_CREATE: "Identity check requested",
  IDENTITY_CHECK_READ: "Identity check result read",
};

export const CALL_KIND_OPTIONS = (
  Object.keys(CALL_LABELS) as PartnerApiCallKind[]
).map((value) => ({ value, label: CALL_LABELS[value] }));

/** Why a call was refused, in plain words. */
const OUTCOME_LABELS: Record<string, string> = {
  invalid_client: "Wrong app ID or password, or the app is paused",
  invalid_grant: "Sign-in code expired or already used",
  invalid_request: "Something was missing or badly written",
  invalid_token: "Sign-in expired",
  identity_check_not_enabled: "Identity check is turned off for this app",
  invalid_phone: "Phone number without a country code",
  not_found: "No such request for this app",
  rate_limited: "Too many requests at once",
  idempotency_conflict: "Same request key used for another number",
  server_error: "Problem on Rabotka's side",
};

export function callLabel(kind: PartnerApiCallKind): string {
  return CALL_LABELS[kind] ?? kind;
}

export function outcomeLabel(outcome: string): string {
  if (outcome === "ok") return "OK";
  return OUTCOME_LABELS[outcome] ?? "Refused";
}

const FIELD_LABELS: Record<string, string> = {
  first_name: "first name",
  last_name: "last name",
  country_code: "country",
  city: "city",
  document_type: "ID type",
  reference: "reference",
};

const STATUS_LABELS: Record<string, string> = {
  pending_consent: "waiting for the person",
  completed: "completed",
  not_completed: "not completed",
};

/**
 * One line describing the request and the answer, from the summaries the
 * server stored. The raw summary stays available in the tooltip.
 */
export function describeRequest(item: OAuthAppRequest): string {
  const { request, response } = item;
  const parts: string[] = [];

  if (item.outcome !== "ok") {
    const description = str(response.description);
    if (description) parts.push(description);
  }

  switch (item.kind) {
    case "TOKEN": {
      const scope = str(response.scope);
      if (scope) parts.push(`Access given: ${scope}`);
      break;
    }
    case "USERINFO": {
      const claims = Array.isArray(response.claims)
        ? (response.claims as string[])
        : [];
      if (claims.length) parts.push(`Details sent: ${claims.join(", ")}`);
      break;
    }
    case "IDENTITY_CHECK_CREATE": {
      const phone = str(request.phone);
      if (phone) parts.push(`Phone ${phone}`);
      const fields = Array.isArray(request.fields_sent)
        ? (request.fields_sent as string[]).map((f) => FIELD_LABELS[f] ?? f)
        : [];
      if (fields.length) parts.push(`with ${fields.join(", ")}`);
      const status = str(response.status);
      if (status) parts.push(`→ ${STATUS_LABELS[status] ?? status}`);
      break;
    }
    case "IDENTITY_CHECK_READ": {
      const status = str(response.status);
      if (status) parts.push(STATUS_LABELS[status] ?? status);
      const recommendation = str(response.recommendation);
      if (recommendation) parts.push(`suggestion: ${recommendation}`);
      if (typeof response.score === "number") {
        parts.push(`score ${response.score}/100`);
      }
      break;
    }
    case "REVOKE":
      break;
  }

  return parts.join(" · ") || "—";
}

/** Milliseconds as a short duration: "45 ms", "1.2 s". */
export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
