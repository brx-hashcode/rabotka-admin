import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import {
  getApplicationsList,
  type AdminApplicationListItem,
} from "#/lib/api/applications-controller";
import { getApplicationStatusLabel } from "#/lib/status-labels";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";
import { buttonVariants } from "#/components/ui/button";
import { appConfig } from "#/config";
import { getAppStatusBadgeClass } from "#/features/applications-admin/components/application-columns";

const columns: ColumnDef<AdminApplicationListItem>[] = [
  {
    id: "employer",
    accessorKey: "employerName",
    header: "Employer",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.employerName}
        email={row.original.employerEmail}
        avatarUrl={row.original.employerAvatarUrl}
      />
    ),
  },
  {
    id: "worker",
    accessorKey: "workerName",
    header: "Worker",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.workerName}
        email={row.original.workerEmail}
        avatarUrl={row.original.workerAvatarUrl}
      />
    ),
  },

  {
    id: "jobTitle",
    accessorKey: "jobTitle",
    header: "Job",
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        <span className="truncate font-medium text-sm">
          {row.original.jobTitle}
        </span>
      </div>
    ),
  },

  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.original.status);
      return (
        <Badge className={getAppStatusBadgeClass(status)}>
          {getApplicationStatusLabel(status)}
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
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Link
          to={`/applications/$applicationId`}
          params={{ applicationId: row.original.id }}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <EyeIcon className="size-4" aria-hidden />
        </Link>
      </div>
    ),
  },
];

export function RecentApplicationsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "recent-applications"],
    queryFn: () =>
      getApplicationsList({ page: 1, limit: appConfig.defaultRecentPageSize }),
  });

  return (
    <DataTable
      data={data?.data ?? []}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No recent applications."
      getRowId={(row) => row.id}
    />
  );
}
