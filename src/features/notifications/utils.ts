export const NOTIFICATION_ENTITY_LABELS: Record<string, string> = {
  profile: "Profile",
  "job-offer": "Job",
  application: "Application",
  claim: "Claim",
  event: "Event",
  payment: "Payment",
  penalty: "Penalty",
};

export function getNotificationHref(
  entityType: string,
  entityId: string,
): string | null {
  switch (entityType) {
    case "profile":
      return `/profiles/${entityId}`;
    case "job-offer":
      return `/jobs/${entityId}`;
    case "application":
      return `/applications/${entityId}`;
    case "penalty":
      return `/penalties/${entityId}`;
    case "claim":
      return "/claim";
    case "event":
      return "/events";
    case "payment":
      return "/wallet";
    default:
      return null;
  }
}

export function formatNotificationDate(value: string): string {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}
