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

export function docCategoryLabel(category: string): string {
  return category === "SELFIE" ? "Selfie" : "Identity Document";
}

export function docTypeLabel(type: string | null): string {
  if (!type) return "Document";
  const map: Record<string, string> = {
    IDENTITY_CARD: "Identity Card",
    PASSPORT: "Passport",
    DRIVER_LICENSE: "Driver License",
    BIRTH_CERTIFICATE: "Birth Certificate",
    STUDENT_CARD: "Student Card",
    NIU_CARD: "NIU Card",
    OTHER: "Other",
  };
  return map[type] ?? type;
}

export function getFileType(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return ext;
  if (ext === "pdf") return "pdf";
  return "png";
}
