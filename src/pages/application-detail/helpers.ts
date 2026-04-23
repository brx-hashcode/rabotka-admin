export function statusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
    case "ACCEPTED":
      return "bg-emerald-500 text-white border-transparent";
    case "STARTED":
      return "bg-blue-500 text-white border-transparent";
    case "COMPLETED":
      return "bg-violet-600 text-white border-transparent";
    case "PENDING":
      return "bg-amber-500 text-white border-transparent";
    case "FILLED":
      return "bg-cyan-500 text-white border-transparent";
    case "EXPIRED":
      return "bg-orange-500 text-white border-transparent";
    case "CANCELLED":
    case "REJECTED":
      return "bg-rose-600 text-white border-transparent";
    default:
      return "bg-muted text-muted-foreground border-border";
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
