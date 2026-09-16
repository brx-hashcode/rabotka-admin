import { Badge } from "#/components/ui/badge";
import type { WhatsappDeliveryStatus } from "#/lib/api/whatsapp-controller";
import { messageCategoryLabel } from "../labels";

/**
 * A delivery status as a badge.
 *
 * The colours encode PROGRESSION, not just category: grey (nothing has
 * happened yet) → blue (handed to Meta) → emerald (on the handset) → violet
 * (opened) → rose (never arrived). A reader scanning the column should be able
 * to see how far a batch got without reading a single label.
 */

const STATUS_STYLE: Record<WhatsappDeliveryStatus, string> = {
  QUEUED: "bg-muted text-muted-foreground",
  SENT: "bg-blue-500 text-white",
  DELIVERED: "bg-emerald-500 text-white",
  READ: "bg-violet-600 text-white",
  FAILED: "bg-rose-600 text-white",
};

const STATUS_LABEL: Record<WhatsappDeliveryStatus, string> = {
  QUEUED: "Preparing",
  SENT: "Sent",
  DELIVERED: "Delivered",
  READ: "Read",
  FAILED: "Failed",
};

export const whatsappStatusOptions = (
  Object.keys(STATUS_LABEL) as WhatsappDeliveryStatus[]
).map((value) => ({ value, label: STATUS_LABEL[value] }));

export function WhatsappStatusBadge({
  status,
}: Readonly<{ status: WhatsappDeliveryStatus }>) {
  return (
    <Badge className={`border-transparent text-xs ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const CATEGORY_STYLE: Record<string, string> = {
  UTILITY: "bg-sky-500 text-white",
  MARKETING: "bg-amber-500 text-white",
  AUTHENTICATION: "bg-indigo-500 text-white",
  SERVICE: "bg-teal-600 text-white",
};

export function WhatsappCategoryBadge({
  category,
}: Readonly<{ category: string | null }>) {
  if (!category) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <Badge
      className={`border-transparent text-xs ${
        CATEGORY_STYLE[category.toUpperCase()] ??
        "bg-muted text-muted-foreground"
      }`}
    >
      {messageCategoryLabel(category)}
    </Badge>
  );
}
