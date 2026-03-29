import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { AdminJobApplicationItem } from "#/lib/api/jobs-controller";
import { getApplicationStatusLabel } from "#/lib/status-labels";

import { DataTable, ProfileCell } from "#/components/table";
import { getCommonColumns } from "#/components/table/data-table-column";
import { Badge } from "#/components/ui/badge";

import { statusBadgeVariant, formatDate, formatAmount } from "../helpers";
import { cn } from "#/lib/utils";
import { buttonVariants } from "#/components/ui/button";
import { Eye } from "lucide-react";

const dataColumns: ColumnDef<AdminJobApplicationItem>[] = [
  {
    id: "worker",
    accessorKey: "workerName",
    header: "Worker",
    cell: ({ row }) => (
      <Link
        to="/profiles/$profileId"
        params={{ profileId: row.original.workerId }}
      >
        <ProfileCell
          name={row.original.workerName}
          email={row.original.workerEmail}
          avatarUrl={row.original.workerAvatarUrl}
        />
      </Link>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const app = row.original;
      return (
        <div className="space-y-0.5">
          <Badge variant={statusBadgeVariant(app.status)}>
            {getApplicationStatusLabel(app.status)}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "applied",
    accessorKey: "createdAt",
    header: "Applied",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "penalty",
    header: "Penalty",
    cell: ({ row }) => {
      const app = row.original;
      if (!app.penaltyApplied) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <span className="inline-flex items-center gap-1 text-xs text-destructive">
          <IconAlertTriangle className="size-3.5" />
          {app.penaltyAmount == null ? "Yes" : formatAmount(app.penaltyAmount)}
        </span>
      );
    },
  },
];

const columns = getCommonColumns<AdminJobApplicationItem>({
  additionalColumns: dataColumns,
  columnsActions: ({ row }) => {
    return (
      <Link
        to="/applications/$applicationId"
        params={{ applicationId: row.id }}
        className={cn(
          buttonVariants({
            variant: "ghost",
            size: "icon",
          }),
        )}
      >
        <Eye />
      </Link>
    );
  },
});

type Props = {
  applications: AdminJobApplicationItem[];
};

export function JobApplicationsTable({ applications }: Readonly<Props>) {
  return (
    <DataTable
      data={applications}
      columns={columns}
      enableRowSelection
      header={
        <h3 className="text-base font-semibold">
          Applications ({applications.length})
        </h3>
      }
      emptyMessage="No applications yet."
      getRowId={(row) => row.id}
    />
  );
}
