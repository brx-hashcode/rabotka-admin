import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "#/components/ui/badge";
import { getCommonColumns } from "#/components/table";
import type { AdminLogItem } from "#/lib/api/logs-controller";
import { LogRowActions } from "./log-row-actions";

function getActionBadgeClass(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("delete") || a.includes("remove") || a.includes("ban") || a.includes("reject") || a.includes("declined") || a.includes("cancel")) {
    return "bg-rose-600 text-white border-transparent";
  }
  if (a.includes("create") || a.includes("register") || a.includes("signup") || a.includes("add")) {
    return "bg-emerald-500 text-white border-transparent";
  }
  if (a.includes("update") || a.includes("edit") || a.includes("change") || a.includes("modify") || a.includes("photo")) {
    return "bg-blue-500 text-white border-transparent";
  }
  if (a.includes("approve") || a.includes("accept") || a.includes("verify") || a.includes("complete") || a.includes("publish")) {
    return "bg-violet-600 text-white border-transparent";
  }
  if (a.includes("login") || a.includes("logout") || a.includes("auth") || a.includes("password") || a.includes("token")) {
    return "bg-amber-500 text-white border-transparent";
  }
  if (a.includes("payment") || a.includes("invoice") || a.includes("wallet") || a.includes("penalty")) {
    return "bg-orange-500 text-white border-transparent";
  }
  if (a.includes("member") || a.includes("team") || a.includes("user") || a.includes("role")) {
    return "bg-indigo-500 text-white border-transparent";
  }
  return "bg-muted text-muted-foreground border-border";
}

function getEntityBadgeClass(entity: string): string {
  switch (entity.toUpperCase()) {
    case "PROFILE":       return "bg-blue-500 text-white border-transparent";
    case "JOB":
    case "JOB_OFFER":     return "bg-teal-600 text-white border-transparent";
    case "APPLICATION":   return "bg-sky-500 text-white border-transparent";
    case "PAYMENT":
    case "PAYMENTREQUEST":return "bg-orange-500 text-white border-transparent";
    case "CLAIM":         return "bg-amber-500 text-white border-transparent";
    case "USER":          return "bg-indigo-500 text-white border-transparent";
    case "PENALTY":       return "bg-orange-600 text-white border-transparent";
    case "DOCUMENT":      return "bg-violet-600 text-white border-transparent";
    case "WALLET":        return "bg-cyan-600 text-white border-transparent";
    default:              return "bg-muted text-muted-foreground border-border";
  }
}

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
      <Badge className={`font-mono text-xs ${getActionBadgeClass(row.original.action)}`}>
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
        <Badge className={`text-xs ${getEntityBadgeClass(row.original.entityType)}`}>
          {row.original.entityType}
        </Badge>
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
