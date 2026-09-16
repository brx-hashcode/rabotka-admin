/**
 * Readable names for activity-log actions and the kind of record they touched.
 * Actions are stored as codes like `KYC_APPROVED`; anything not listed is
 * turned into words rather than shown as a code.
 */

const RECORD_TYPES: Record<string, string> = {
  Profile: "Profile",
  PaymentRequest: "Payment request",
  Application: "Application",
  JobOffer: "Job",
  User: "Team member",
  KYC: "Identity check (KYC)",
  Wallet: "Wallet",
  Penalty: "Penalty",
  OAuthApp: "Partner app",
  IdentityCheck: "Identity check request",
  Claim: "Claim",
  Contract: "Contract",
  Invoice: "Invoice",
  Advertisement: "Ad",
  Document: "Document",
};

/** Words inside action codes that read better replaced. */
const ACTION_WORDS: Record<string, string> = {
  KYC: "identity check (KYC)",
  OTP: "sign-in code",
  TOTP: "two-step sign-in",
  OAUTH: "partner",
  APP: "app",
  SECRET: "password",
  DLQ: "failed message",
  ROTATED: "renewed",
  REVOKED: "cancelled",
  REVEALED: "shown",
};

export function recordTypeLabel(type: string | null): string {
  if (!type) return "—";
  return RECORD_TYPES[type] ?? sentence(splitCamel(type));
}

export function actionLabel(action: string | null): string {
  if (!action) return "—";
  const words = action
    .split("_")
    .filter(Boolean)
    .map((word) => ACTION_WORDS[word.toUpperCase()] ?? word.toLowerCase());
  return sentence(words.join(" "));
}

function splitCamel(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

function sentence(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
