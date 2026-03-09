import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import {
  getProfilesList,
  type AdminProfileListItem,
} from "#/lib/api/profiles-controller";
import {
  getAccountStatusLabel,
  getProfileTypeLabel,
} from "#/lib/status-labels";

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "BANNED":
      return "destructive";
    case "SUSPENDED":
      return "secondary";
    default:
      return "outline";
  }
}

const columns: ColumnDef<AdminProfileListItem>[] = [
  {
    id: "profile",
    accessorKey: "firstName",
    header: "Profile",
    cell: ({ row }) => {
      const p = row.original;
      const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
      return (
        <ProfileCell
          name={name}
          email={p.email ?? ""}
          avatarUrl={p.avatarUrl}
        />
      );
    },
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.phone ?? "—"}
      </span>
    ),
  },
  {
    id: "address",
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.address ?? "—"}
      </span>
    ),
  },
  {
    id: "profileType",
    accessorKey: "profileType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.profileType;
      const variant = type === "EMPLOYER" ? "default" : "secondary";
      return <Badge variant={variant}>{getProfileTypeLabel(type)}</Badge>;
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.original.status);
      return (
        <Badge variant={getStatusBadgeVariant(status)}>
          {getAccountStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created at",
    cell: ({ row }) => {
      const v = row.original.createdAt;
      if (!v) return "—";
      return new Date(v).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    },
  },
];

export function RecentProfilesTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "recent-profiles"],
    queryFn: () => getProfilesList({ page: 1, limit: 5 }),
  });

  return (
    <DataTable
      data={data?.data ?? []}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No recent profiles."
      getRowId={(row) => row.id}
    />
  );
}
