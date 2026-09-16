import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "#/components/ui/badge";
import { getCommonColumns } from "#/components/table";
import type { AdminNotificationItem } from "#/lib/api/notification-controller";
import {
  formatNotificationDate,
  getNotificationHref,
  NOTIFICATION_ENTITY_LABELS,
} from "#/features/notifications/utils";
import { NotificationRowActions } from "./notification-row-actions";

function getEntityBadgeClass(entity: string): string {
  switch (entity) {
    case "profile":
      return "bg-blue-500 text-white border-transparent";
    case "job-offer":
      return "bg-emerald-500 text-white border-transparent";
    case "application":
      return "bg-violet-500 text-white border-transparent";
    case "claim":
      return "bg-amber-500 text-white border-transparent";
    case "event":
      return "bg-pink-500 text-white border-transparent";
    case "payment":
      return "bg-green-500 text-white border-transparent";
    case "penalty":
      return "bg-rose-600 text-white border-transparent";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

const notificationDataColumns: ColumnDef<AdminNotificationItem, unknown>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="font-medium text-sm">{row.original.title}</p>
      </div>
    ),
  },
  {
    accessorKey: "message",
    header: "Message",
    cell: ({ row }) => (
      <p className="max-w-md truncate text-sm text-muted-foreground">
        {row.original.message}
      </p>
    ),
  },
  {
    id: "entityType",
    header: "About",
    cell: ({ row }) => (
      <Badge
        className={`text-xs ${getEntityBadgeClass(row.original.entity_type)}`}
      >
        {NOTIFICATION_ENTITY_LABELS[row.original.entity_type] ??
          row.original.entity_type}
      </Badge>
    ),
  },
  {
    id: "read",
    header: "State",
    cell: ({ row }) =>
      row.original.read ? (
        <Badge variant="outline">Read</Badge>
      ) : (
        <Badge className="bg-primary text-primary-foreground border-transparent">
          Unread
        </Badge>
      ),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm">
        {formatNotificationDate(row.original.created_at)}
      </span>
    ),
  },
];

export function makeNotificationColumns(
  onOpen: (notification: AdminNotificationItem) => void,
  onDelete: (notification: AdminNotificationItem) => void,
) {
  return getCommonColumns<AdminNotificationItem>({
    additionalColumns: notificationDataColumns,
    columnsActions: ({ row }) => (
      <NotificationRowActions
        notification={row}
        canOpen={Boolean(getNotificationHref(row.entity_type, row.entity_id))}
        onOpen={onOpen}
        onDelete={onDelete}
      />
    ),
  });
}
