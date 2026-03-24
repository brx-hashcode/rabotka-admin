import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "#/components/ui/badge";
import { getCommonColumns } from "#/components/table";
import type { AdminLogItem } from "#/lib/api/logs-controller";
import { LogRowActions } from "./log-row-actions";

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

const logDataColumns: ColumnDef<AdminLogItem, unknown>[] = [
  {
    id: "action",
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono text-xs">
        {row.original.action}
      </Badge>
    ),
  },
  {
    id: "entityType",
    accessorKey: "entityType",
    header: "Entity",
    cell: ({ row }) =>
      row.original.entityType ? (
        <span className="text-sm">{row.original.entityType}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    id: "actor",
    header: "Actor",
    cell: ({ row }) => {
      const name = row.original.userName ?? row.original.profileName;
      return name ? (
        <span className="text-sm">{name}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    id: "ipAddress",
    accessorKey: "ipAddress",
    header: "IP Address",
    cell: ({ row }) =>
      row.original.ipAddress ? (
        <span className="font-mono text-xs">{row.original.ipAddress}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">{formatDate(row.original.createdAt)}</span>
    ),
  },
];

export function makeLogColumns(onView: (log: AdminLogItem) => void) {
  return getCommonColumns<AdminLogItem>({
    additionalColumns: logDataColumns,
    columnsActions: ({ row }) => (
      <LogRowActions log={row} onView={onView} />
    ),
  });
}
