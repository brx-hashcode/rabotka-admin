export function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
    case "VERIFIED":
      return "default";
    case "PENDING":
    case "PENDING_ACTIVATION":
      return "secondary";
    case "SUSPENDED":
    case "REJECTED":
    case "BANNED":
      return "destructive";
    default:
      return "outline";
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Date and time, for values where the hour is the point — a last login two
 * hours ago and one at 3am read very differently, and `formatDate` drops that.
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Which file of a KYC submission a document row holds.
 *
 * Must name the side explicitly: a profile now submits both a front and a back
 * (everything except a passport, whose photo page carries all its data), and
 * labelling both "Identity Document" would leave a reviewer unable to tell
 * which card they are looking at.
 *
 * Mirrors the backend's KycDocumentCategory enum. The fallback covers rows
 * predating the split, whose category is already one of the three.
 */
export function docCategoryLabel(category: string): string {
  switch (category) {
    case "SELFIE":
      return "Selfie";
    case "DOCUMENT":
      return "Identity Document (Front)";
    case "DOCUMENT_BACK":
      return "Identity Document (Back)";
    default:
      return "Identity Document";
  }
}

/**
 * Mirrors the backend's DocumentType enum.
 *
 * The fallback is load-bearing: profiles submitted before the enum was cut to
 * these four have a NULL type, and older rows may carry a value no longer
 * listed. Both must still render rather than blank the card.
 */
export function docTypeLabel(type: string | null): string {
  if (!type) return "Document";
  const map: Record<string, string> = {
    IDENTITY_CARD: "Identity Card",
    PASSPORT: "Passport",
    DRIVER_LICENSE: "Driver License",
    NIU_CARD: "NIU Card",
  };
  return map[type] ?? type;
}

export function getFileType(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return ext;
  if (ext === "pdf") return "pdf";
  return "png";
}
