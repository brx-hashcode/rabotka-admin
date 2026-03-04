/**
 * Maps backend enum/status values to human-readable English labels.
 * Use for display in tables, filters, and badges.
 */

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
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

export function getAccountStatusLabel(status: string): string {
  return ACCOUNT_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function getProfileTypeLabel(profileType: string): string {
  return PROFILE_TYPE_LABELS[profileType] ?? profileType;
}

export function getVerificationStatusLabel(verificationStatus: string): string {
  return VERIFICATION_STATUS_LABELS[verificationStatus] ?? verificationStatus;
}
