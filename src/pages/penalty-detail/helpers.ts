export function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
    case "ACCEPTED":
    case "COMPLETED":
      return "default";
    case "PENDING":
    case "FILLED":
      return "secondary";
    case "CANCELLED":
    case "REJECTED":
      return "destructive";
    default:
      return "outline";
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}
