/**
 * Maps backend enum/status values to human-readable English labels.
 * Use for display in tables, filters, and badges.
 */

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PENDING_ACTIVATION: "Waiting for activation",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  BANNED: "Banned",
} as const;

export const PROFILE_TYPE_LABELS: Record<string, string> = {
  WORKER: "Worker",
  EMPLOYER: "Employer",
} as const;

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
} as const;

export const JOB_OFFER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PARTIALLY_FILLED: "Partly filled",
  FILLED: "Filled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
} as const;

/**
 * How an offer pays. Mirrors the backend `PaymentFlow` enum exactly — the
 * Payment column renders a badge for `FIXED` too, but that value is not in the
 * enum and cannot come back from the API, so it is deliberately not offered as
 * a filter option: a filter that can only ever return nothing is worse than no
 * filter at all.
 */
export const PAYMENT_FLOW_LABELS: Record<string, string> = {
  // A fixed price for the whole job — « par tâche » in the apps.
  TASK: "Per task",
  HOURLY: "Hourly",
  DAILY: "Daily",
  MONTHLY: "Monthly",
} as const;

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
} as const;

export const ADVERTISEMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Waiting for review",
  APPROVED: "Approved",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
} as const;

export function getAdvertisementStatusLabel(status: string): string {
  return ADVERTISEMENT_STATUS_LABELS[status] ?? humanizeCode(status);
}

/**
 * Any stored code as words — `PENDING_ACTIVATION` → "Pending activation" —
 * for values with no label of their own, so an uppercase code never reaches
 * the screen.
 */
export function humanizeCode(value: string | null | undefined): string {
  if (!value) return "—";
  const words = value.replaceAll("_", " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const TEAM_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  MODERATOR: "Moderator",
  FINANCE: "Finance",
  SUPPORT: "Support",
} as const;

export const MESSAGE_CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  IN_APP: "In the app",
  SMS: "SMS",
} as const;

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Waiting",
  QUEUED: "Preparing",
  SENT: "Sent",
  DELIVERED: "Delivered",
  OPENED: "Opened",
  READ: "Read",
  CLICKED: "Clicked",
  FAILED: "Failed",
  BOUNCED: "Not delivered",
} as const;

/** The label from `labels`, or the code turned into words. */
export function labelOf(
  labels: Record<string, string>,
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return labels[value] ?? humanizeCode(value);
}

export const PENALTY_PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
} as const;

export const PENALTY_APPLIED_LABELS: Record<string, string> = {
  true: "Yes",
  false: "No",
} as const;

export function getAccountStatusLabel(status: string): string {
  return ACCOUNT_STATUS_LABELS[status] ?? humanizeCode(status);
}

export function getProfileTypeLabel(profileType: string): string {
  return PROFILE_TYPE_LABELS[profileType] ?? profileType;
}

export function getVerificationStatusLabel(verificationStatus: string): string {
  return VERIFICATION_STATUS_LABELS[verificationStatus] ?? verificationStatus;
}

export function getJobOfferStatusLabel(status: string): string {
  return JOB_OFFER_STATUS_LABELS[status] ?? humanizeCode(status);
}

export function getApplicationStatusLabel(status: string): string {
  return APPLICATION_STATUS_LABELS[status] ?? humanizeCode(status);
}

/**
 * Referral payout states, in the words an admin needs when someone asks why a
 * parrainage was not paid.
 *
 * Four of the five mean "no money moved", and they mean different things:
 * "On hold" is waiting on the parrain's own KYC, "Capped" is a rule that
 * declined to pay, and "Forfeited" is a parrain who is gone. Collapsing them
 * into "not paid" is what makes support unanswerable.
 */
export const REFERRAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  QUALIFIED_ON_HOLD: "On hold",
  REWARDED: "Rewarded",
  CAPPED: "Capped",
  FORFEITED: "Forfeited",
} as const;

export function getReferralStatusBadgeClass(status: string): string {
  switch (status) {
    case "REWARDED":
      return "bg-emerald-500 text-white border-transparent";
    case "QUALIFIED_ON_HOLD":
      return "bg-amber-500 text-white border-transparent";
    case "PENDING":
      return "bg-sky-500 text-white border-transparent";
    // Capped and forfeited are both terminal non-payments, and neither is an
    // error — a red badge here would send admins hunting for a bug.
    case "CAPPED":
    case "FORFEITED":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export type NotificationState = "UNREAD" | "READ" | "DISMISSED";

/**
 * A profile notification's state in the admin tab. Dismissed is amber, not
 * red: the profile cleared it from their own feed, which is not a fault.
 */
export function getNotificationStateBadgeClass(state: NotificationState): string {
  switch (state) {
    case "UNREAD":
      return "bg-sky-500 text-white border-transparent";
    case "READ":
      return "bg-emerald-500 text-white border-transparent";
    case "DISMISSED":
      return "bg-amber-500 text-white border-transparent";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
