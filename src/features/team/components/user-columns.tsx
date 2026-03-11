import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminUserListItem } from "#/lib/api/users-controller";
import { UserRowActions } from "./user-row-actions";

export type AdminUser = AdminUserListItem;

function getRoleBadgeVariant(
  role: string,
): "default" | "secondary" | "outline" {
  switch (role) {
    case "SUPER_ADMIN":
      return "default";
    case "ADMIN":
      return "secondary";
    default:
      return "outline";
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN":
      return "Admin";
    default:
      return role;
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
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">
          {row.original.firstName} {row.original.lastName}
        </span>
        <span className="text-muted-foreground text-xs">
          {row.original.email}
        </span>
      </div>
    ),
  },
  {
    id: "role",
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={getRoleBadgeVariant(row.original.role)}>
        {getRoleLabel(row.original.role)}
      </Badge>
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
