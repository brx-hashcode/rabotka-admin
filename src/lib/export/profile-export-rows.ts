import type { AdminProfileListItem } from "#/lib/api/profiles-controller";

/**
 * Every field the admin API exposes for a profile, grouped the way someone
 * reading the spreadsheet would look for them: who they are, where they are,
 * what they do, what state the account is in, then activity and timestamps.
 *
 * Deliberately excluded: `payment_link` and its expiry. Those are live one-time
 * payment URLs, and a spreadsheet gets forwarded, emailed and left in downloads
 * folders — the export is the one place they should not travel to. Everything
 * else the record holds is here.
 *
 * Must stay index-aligned with both row builders below.
 */
export const PROFILE_EXPORT_HEADERS = [
  // Identity
  "ID",
  "First name",
  "Last name",
  "Email",
  "Phone",
  // Location
  "Address",
  "City",
  "Country code",
  "Country",
  "Latitude",
  "Longitude",
  // What they do
  "Description",
  "Domains",
  "Type",
  // Account state
  "Status",
  "Billing status",
  "Suspension reason",
  "Suspended at (ISO)",
  // Verification
  "Verification",
  "Verified by",
  "Verified at (ISO)",
  "Rejection reason",
  "KYC note",
  // Quality
  "Reliability score",
  "Rating average",
  "Rating count",
  // Activity
  "Job offers",
  "Applications",
  "Penalties",
  "Unpaid penalties",
  // Engagement
  "WhatsApp",
  "Last login (ISO)",
  "Activated at (ISO)",
  "First login pending",
  "Policies accepted",
  // Links
  "Portfolio slug",
  "Avatar URL",
  "Vector indexed at (ISO)",
  // Timestamps
  "Created at (ISO)",
  "Updated at (ISO)",
] as const;

/** Domains joined for a single cell; the CSV writer quotes the separator. */
const domains = (p: AdminProfileListItem) => p.categoryNames.join(", ");

const yesNo = (value: boolean) => (value ? "Yes" : "No");

/**
 * CSV variant — every cell a string, nulls flattened to empty.
 *
 * Numbers are stringified rather than left raw so an absent score exports as an
 * empty cell instead of the literal "null", which spreadsheet software would
 * otherwise treat as text and sort above every real value.
 */
export function profileItemsToStringRows(
  items: AdminProfileListItem[],
): string[][] {
  return items.map((p) => [
    p.id ?? "",
    p.firstName ?? "",
    p.lastName ?? "",
    p.email ?? "",
    p.phone ?? "",
    p.address ?? "",
    p.city ?? "",
    p.countryCode ?? "",
    p.countryName ?? "",
    p.latitude == null ? "" : String(p.latitude),
    p.longitude == null ? "" : String(p.longitude),
    p.description ?? "",
    domains(p),
    p.profileType ?? "",
    p.status ?? "",
    p.billingStatus ?? "",
    p.suspensionReason ?? "",
    p.suspendedAt ?? "",
    p.verificationStatus ?? "",
    p.verifiedBy ?? "",
    p.verifiedAt ?? "",
    p.rejectionReason ?? "",
    p.kycVerificationNote ?? "",
    p.reliabilityScore == null ? "" : String(p.reliabilityScore),
    p.ratingAvg == null ? "" : String(p.ratingAvg),
    String(p.ratingCount ?? 0),
    String(p.jobOffersCount ?? 0),
    String(p.applicationsCount ?? 0),
    String(p.penaltiesCount ?? 0),
    String(p.unpaidPenaltiesCount ?? 0),
    p.whatsappConnected ? "Connected" : "Disconnected",
    p.lastLoginAt ?? "",
    p.activatedAt ?? "",
    yesNo(p.firstLogin),
    yesNo(p.readAndApprovedPolicies),
    p.portfolioSlug ?? "",
    p.avatarUrl ?? "",
    p.vectorIndexedAt ?? "",
    p.createdAt ?? "",
    p.updatedAt ?? "",
  ]);
}

/**
 * XLSX variant — numerics stay numeric so Excel can sort and aggregate them.
 *
 * `null` is passed through for a missing number rather than coerced to 0: a
 * worker with no rating has not scored zero, and averaging a column of
 * substituted zeros silently understates every real result.
 */
export function profileItemsToTypedRows(
  items: AdminProfileListItem[],
): (string | number | null)[][] {
  return items.map((p) => [
    p.id ?? "",
    p.firstName ?? "",
    p.lastName ?? "",
    p.email ?? "",
    p.phone ?? "",
    p.address ?? "",
    p.city ?? "",
    p.countryCode ?? "",
    p.countryName ?? "",
    p.latitude,
    p.longitude,
    p.description ?? "",
    domains(p),
    p.profileType ?? "",
    p.status ?? "",
    p.billingStatus ?? "",
    p.suspensionReason ?? "",
    p.suspendedAt ?? "",
    p.verificationStatus ?? "",
    p.verifiedBy ?? "",
    p.verifiedAt ?? "",
    p.rejectionReason ?? "",
    p.kycVerificationNote ?? "",
    p.reliabilityScore,
    p.ratingAvg,
    p.ratingCount ?? 0,
    p.jobOffersCount ?? 0,
    p.applicationsCount ?? 0,
    p.penaltiesCount ?? 0,
    p.unpaidPenaltiesCount ?? 0,
    p.whatsappConnected ? "Connected" : "Disconnected",
    p.lastLoginAt ?? "",
    p.activatedAt ?? "",
    yesNo(p.firstLogin),
    yesNo(p.readAndApprovedPolicies),
    p.portfolioSlug ?? "",
    p.avatarUrl ?? "",
    p.vectorIndexedAt ?? "",
    p.createdAt ?? "",
    p.updatedAt ?? "",
  ]);
}
