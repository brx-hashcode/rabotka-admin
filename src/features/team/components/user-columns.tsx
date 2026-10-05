import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns } from "#/components/table";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import type { AdminUserListItem } from "#/lib/api/users-controller";
import { UserRowActions } from "./user-row-actions";
import { TEAM_ROLE_LABELS, labelOf } from "#/lib/status-labels";

export type AdminUser = AdminUserListItem;

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-violet-600 text-white border-transparent hover:bg-violet-700";
    case "ADMIN":
      return "bg-blue-600 text-white border-transparent hover:bg-blue-700";
    case "MANAGER":
      return "bg-amber-500 text-white border-transparent hover:bg-amber-600";
    case "MODERATOR":
      return "bg-teal-500 text-white border-transparent hover:bg-teal-600";
    case "FINANCE":
      return "bg-emerald-600 text-white border-transparent hover:bg-emerald-700";
    case "SUPPORT":
      return "bg-sky-600 text-white border-transparent hover:bg-sky-700";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function formatDate(value: string | null | undefined): string {
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

const userDataColumns: ColumnDef<AdminUser, unknown>[] = [
  {
    id: "name",
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {(row.original.firstName[0] ?? "").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">
            {row.original.firstName} {row.original.lastName}
          </span>
          <span className="text-muted-foreground text-xs">
            {row.original.email}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "role",
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <Badge className={getRoleBadgeClass(row.original.role)}>
          {labelOf(TEAM_ROLE_LABELS, row.original.role)}
        </Badge>
        {row.original.kycReviewer && (
          <Badge
            variant="secondary"
            title="In the KYC verification group: emailed to review each new profile"
          >
            KYC
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: "isActive",
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "destructive"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "lastLoginAt",
    accessorKey: "lastLoginAt",
    header: "Last Login",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDate(row.original.lastLoginAt)}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Updated At",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDate(row.original.updatedAt)}
      </span>
    ),
  },
];

export const userColumns = getCommonColumns<AdminUser>({
  additionalColumns: userDataColumns,
  columnsActions: ({ row }) => <UserRowActions user={row} />,
});
