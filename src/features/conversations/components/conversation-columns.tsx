import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminConversationListItem } from "#/lib/api/conversations-controller";
import { ConversationRowActions } from "./conversation-row-actions";

export type Conversation = AdminConversationListItem;

export const conversationStatusOptions = [
  { label: "Open", value: "OPEN" },
  { label: "Closed", value: "CLOSED" },
];

export const conversationFlagOptions = [
  { label: "Has held messages", value: "HELD" },
  { label: "Has redactions", value: "REDACTED" },
  { label: "Report pending", value: "REPORTED" },
  { label: "Direct (no application)", value: "DIRECT" },
];

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

const conversationDataColumns: ColumnDef<Conversation, unknown>[] = [
  {
    id: "worker",
    accessorKey: "worker.name",
    header: "Worker",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.worker.name}
        email={row.original.worker.phone}
        avatarUrl={row.original.worker.avatarUrl}
      />
    ),
  },
  {
    id: "employer",
    accessorKey: "employer.name",
    header: "Employer",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.employer.name}
        email={row.original.employer.phone}
        avatarUrl={row.original.employer.avatarUrl}
      />
    ),
  },
  {
    id: "context",
    accessorKey: "jobTitle",
    header: "Context",
    cell: ({ row }) => {
      // No application behind it means one side wrote to somebody who never
      // applied — cold outreach, which the service caps per day precisely
      // because it reaches people who did not ask. Worth seeing at a glance.
      const { jobTitle } = row.original;
      if (!jobTitle) {
        return (
          <Badge className="border-transparent bg-violet-600 text-white">
            Direct
          </Badge>
        );
      }
      return (
        <div className="max-w-[200px]">
          <span className="wrap-break-word whitespace-normal text-sm font-medium">
            {jobTitle}
          </span>
        </div>
      );
    },
  },
  {
    id: "messageCount",
    accessorKey: "messageCount",
    header: "Msgs",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.original.messageCount}</span>
    ),
  },
  {
    id: "redactedCount",
    accessorKey: "redactedCount",
    header: "Withheld",
    cell: ({ row }) => {
      // The triage column. "80% of this account's messages are redacted" is the
      // question the list exists to answer without opening a single thread.
      const { redactedCount, messageCount } = row.original;
      if (redactedCount === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      const share = messageCount
        ? Math.round((redactedCount / messageCount) * 100)
        : 0;
      return (
        <div className="whitespace-nowrap">
          <span className="text-sm font-medium tabular-nums">
            {redactedCount}
          </span>
          <span className="text-muted-foreground ml-1 text-xs tabular-nums">
            {share}%
          </span>
        </div>
      );
    },
  },
  {
    id: "heldCount",
    accessorKey: "heldCount",
    header: "Held",
    cell: ({ row }) => {
      // Highest signal per pixel on this table: a held message was MOSTLY
      // contact details and reached nobody. Nonzero is worth a look.
      const { heldCount } = row.original;
      if (heldCount === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return <Badge variant="destructive">{heldCount}</Badge>;
    },
  },
  {
    id: "pendingReportCount",
    accessorKey: "pendingReportCount",
    header: "Reports",
    cell: ({ row }) => {
      const { pendingReportCount } = row.original;
      if (pendingReportCount === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <Badge className="border-transparent bg-amber-500 text-white">
          {pendingReportCount}
        </Badge>
      );
    },
  },
  {
    id: "status",
    accessorKey: "closedAt",
    header: "Status",
    cell: ({ row }) => {
      const { closedAt, worker, employer } = row.original;
      const cleared = [
        worker.hiddenAt ? "worker" : null,
        employer.hiddenAt ? "employer" : null,
      ].filter(Boolean);

      return (
        <div className="space-y-1 whitespace-nowrap">
          {closedAt ? (
            <Badge variant="secondary">Closed</Badge>
          ) : (
            <Badge className="border-transparent bg-emerald-600 text-white">
              Open
            </Badge>
          )}
          {/* A side clearing their copy deletes nothing, but it is the answer to
              "they swear they never saw it", so it belongs on the row. */}
          {cleared.length > 0 && (
            <p className="text-muted-foreground text-xs">
              cleared by {cleared.join(" & ")}
            </p>
          )}
        </div>
      );
    },
  },
  {
    id: "lastMessageAt",
    accessorKey: "lastMessageAt",
    header: "Last activity",
    cell: ({ row }) => {
      // Null is not missing data: it is a conversation in which every message
      // was held back, so nothing was ever delivered to bump it. Say so.
      const { lastMessageAt, heldCount } = row.original;
      if (!lastMessageAt) {
        return (
          <span className="text-muted-foreground text-sm">
            {heldCount > 0 ? "nothing delivered" : "never written in"}
          </span>
        );
      }
      return (
        <span className="text-sm whitespace-nowrap">
          {formatDateTime(lastMessageAt)}
        </span>
      );
    },
  },
];

export const conversationColumns = getCommonColumns<Conversation>({
  additionalColumns: conversationDataColumns,
  columnsActions: ({ row }) => <ConversationRowActions conversation={row} />,
});
