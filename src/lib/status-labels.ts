/**
 * Maps backend enum/status values to human-readable English labels.
 * Use for display in tables, filters, and badges.
 */

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PENDING_ACTIVATION: "En attente d'activation",
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
  ACTIVE: "Active",
  FILLED: "Filled",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
} as const;

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
} as const;

export const PENALTY_PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
} as const;

export const PENALTY_APPLIED_LABELS: Record<string, string> = {
  true: "Yes",
  false: "No",
} as const;

export function getAccountStatusLabel(status: string): string {
  return ACCOUNT_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function getProfileTypeLabel(profileType: string): string {
  return PROFILE_TYPE_LABELS[profileType] ?? profileType;
}

export function getVerificationStatusLabel(verificationStatus: string): string {
  return VERIFICATION_STATUS_LABELS[verificationStatus] ?? verificationStatus;
}

export function getJobOfferStatusLabel(status: string): string {
  return JOB_OFFER_STATUS_LABELS[status] ?? status;
}

export function getApplicationStatusLabel(status: string): string {
  return APPLICATION_STATUS_LABELS[status] ?? status;
}
