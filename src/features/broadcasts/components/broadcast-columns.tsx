import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Bell, Mail, MessageCircle } from "lucide-react";

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

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  IN_APP: Bell,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
};

const nf = (n: number) => n.toLocaleString("fr-FR");

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Who the broadcast was for, from its filters: « Workers », « Employers »… */
function audienceLabel(b: Broadcast): string {
  const types = b.audience?.profile_types ?? [];
  const who =
    types.length === 0 || types.length > 1
      ? "Everyone"
      : types[0] === "WORKER"
        ? "Workers"
        : "Employers";
  const cities = b.audience?.cities ?? [];
  return cities.length ? `${who} · ${cities.slice(0, 2).join(", ")}${cities.length > 2 ? "…" : ""}` : who;
}

export const broadcastColumns: ColumnDef<Broadcast>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="flex min-w-0 max-w-xl flex-col gap-0.5">
        <Link
          to="/broadcasts/$broadcastId"
          params={{ broadcastId: row.original.id }}
          className="truncate font-medium hover:underline"
        >
          {row.original.title}
        </Link>
        <span className="text-muted-foreground truncate text-xs">
          {audienceLabel(row.original)}
          {row.original.recipient_count > 0
            ? ` · ${nf(row.original.recipient_count)} message${row.original.recipient_count > 1 ? "s" : ""}`
            : ""}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]} className="gap-1.5">
        {row.original.status === "SENDING" ? (
          <span className="size-1.5 animate-pulse rounded-full bg-current" />
        ) : null}
        {BROADCAST_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "channels",
    header: "Channels",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.channels.map((c) => {
          const Icon = CHANNEL_ICONS[c] ?? Bell;
          return (
            <Badge key={c} variant="outline" className="gap-1 font-normal">
              <Icon className="size-3" />
              {CHANNEL_LABELS[c] ?? c}
            </Badge>
          );
        })}
      </div>
    ),
  },
  {
    id: "delivery",
    header: "Delivered",
    cell: ({ row }) => {
      const { sent_count, failed_count, recipient_count, status } = row.original;
      if (recipient_count === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      const sentPct = (sent_count / recipient_count) * 100;
      const failedPct = (failed_count / recipient_count) * 100;
      const waiting = status === "SCHEDULED" || status === "SENDING";
      return (
        <div className="flex w-40 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2 text-sm tabular-nums">
            <span>
              {nf(sent_count)}
              <span className="text-muted-foreground"> / {nf(recipient_count)}</span>
            </span>
            {failed_count > 0 ? (
              <span className="text-destructive text-xs">
                {nf(failed_count)} failed
              </span>
            ) : waiting ? (
              <span className="text-muted-foreground text-xs">waiting</span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {Math.round(sentPct)} %
              </span>
            )}
          </div>
          <div className="bg-muted flex h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-whatsapp h-full"
              style={{ width: `${sentPct}%` }}
            />
            <div
              className="bg-destructive h-full"
              style={{ width: `${failedPct}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "read",
    header: "Read",
    cell: ({ row }) =>
      row.original.channels.includes("IN_APP") && row.original.sent_count > 0 ? (
        <span className="text-sm tabular-nums">{nf(row.original.read_count)}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    id: "when",
    header: "Sent",
    cell: ({ row }) => {
      const b = row.original;
      if (b.status === "SCHEDULED" && b.scheduled_at) {
        return (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Scheduled for</span>
            <span className="text-sm">{formatDate(b.scheduled_at)}</span>
          </div>
        );
      }
      return (
        <span className="text-muted-foreground text-sm">
          {formatDate(b.sent_at ?? b.scheduled_at)}
        </span>
      );
    },
  },
];
