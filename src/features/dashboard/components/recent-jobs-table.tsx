import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import {
  getJobOffersList,
  type AdminJobOfferListItem,
} from "#/lib/api/jobs-controller";
import { getJobOfferStatusLabel } from "#/lib/status-labels";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";
import { buttonVariants } from "#/components/ui/button";
import { getStatusBadgeClass } from "#/features/jobs/components/job-columns";
import { appConfig } from "#/config";

const columns: ColumnDef<AdminJobOfferListItem>[] = [
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
    id: "title",
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        <span className="truncate font-medium text-sm">
          {row.original.title}
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
        <Badge className={getStatusBadgeClass(status)}>
          {getJobOfferStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.original.amount;
      // Same rule as the jobs table: the field is optional at creation, and
      // 0 means "no price set" rather than "pays nothing".
      if (amount == null || amount === 0) return "—";

      return (
        <span className="text-sm font-medium">
          {amount.toLocaleString()} FCFA
        </span>
      );
    },
  },
  {
    id: "scheduledAt",
    accessorKey: "scheduledAt",
    header: "Scheduled at",
    cell: ({ row }) => {
      const v = row.original.scheduledAt;
      if (!v) return "—";
      return (
        <span className="text-muted-foreground text-sm">
          {new Date(v).toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
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
          to={`/jobs/$jobId`}
          params={{ jobId: row.original.id }}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <EyeIcon className="size-4" aria-hidden />
        </Link>
      </div>
    ),
  },
];

export function RecentJobsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "recent-jobs"],
    queryFn: () => getJobOffersList({ page: 1, limit: appConfig.defaultRecentPageSize }),
  });

  return (
    <DataTable
      data={data?.data ?? []}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="No recent jobs."
      getRowId={(row) => row.id}
    />
  );
}
