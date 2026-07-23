import type { AdminProfileListItem } from "#/lib/api/profiles-controller";

export const PROFILE_EXPORT_HEADERS = [
  "First name",
  "Last name",
  "Email",
  "Phone",
  "Status",
  "Type",
  "WhatsApp",
  "Verification",
  "Reliability score",
  "Address",
  "Created at (ISO)",
  "Updated at (ISO)",
] as const;

export function profileItemsToStringRows(
  items: AdminProfileListItem[],
): string[][] {
  return items.map((p) => [
    p.firstName ?? "",
    p.lastName ?? "",
    p.email ?? "",
    p.phone ?? "",
    p.status ?? "",
    p.profileType ?? "",
    p.whatsappConnected ? "Connected" : "Disconnected",
    p.verificationStatus ?? "",
    p.reliabilityScore == null ? "" : String(p.reliabilityScore),
    p.address ?? "",
    p.createdAt ?? "",
    p.updatedAt ?? "",
  ]);
}

export function profileItemsToTypedRows(
  items: AdminProfileListItem[],
): (string | number | null)[][] {
  return items.map((p) => [
    p.firstName ?? "",
    p.lastName ?? "",
    p.email ?? "",
    p.phone ?? "",
    p.status ?? "",
    p.profileType ?? "",
    p.whatsappConnected ? "Connected" : "Disconnected",
    p.verificationStatus ?? "",
    p.reliabilityScore,
    p.address ?? "",
    p.createdAt ?? "",
    p.updatedAt ?? "",
  ]);
}
