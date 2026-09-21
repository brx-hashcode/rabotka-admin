import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { Badge } from "#/components/ui/badge";
import type { Broadcast, BroadcastStatus } from "#/lib/api/broadcasts-controller";

export const BROADCAST_STATUS_LABELS: Record<BroadcastStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  SENDING: "Sending",
  SENT: "Sent",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

export const broadcastStatusOptions = (
  Object.keys(BROADCAST_STATUS_LABELS) as BroadcastStatus[]
).map((value) => ({ value, label: BROADCAST_STATUS_LABELS[value] }));

const STATUS_VARIANT: Record<
  BroadcastStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  SENDING: "default",
  SENT: "default",
  CANCELLED: "secondary",
  FAILED: "destructive",
};

const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: "In-app",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const broadcastColumns: ColumnDef<Broadcast>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        to="/broadcasts/$broadcastId"
        params={{ broadcastId: row.original.id }}
        className="font-medium hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]}>
        {BROADCAST_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "channels",
    header: "Channels",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.channels
          .map((c) => CHANNEL_LABELS[c] ?? c)
          .join(", ")}
      </span>
    ),
  },
  {
    id: "delivery",
    header: "Delivered",
    cell: ({ row }) => {
      const { sent_count, failed_count, recipient_count } = row.original;
      if (recipient_count === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <span className="text-sm tabular-nums">
          {sent_count.toLocaleString("fr-FR")}/
          {recipient_count.toLocaleString("fr-FR")}
          {failed_count > 0 ? (
            <span className="text-destructive">
              {" "}
              · {failed_count.toLocaleString("fr-FR")} failed
            </span>
          ) : null}
        </span>
      );
    },
  },
  {
    id: "when",
    header: "Sent",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDate(row.original.sent_at ?? row.original.scheduled_at)}
      </span>
    ),
  },
];
