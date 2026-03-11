import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminApplicationListItem } from "#/lib/api/applications-controller";
import { ApplicationRowActions } from "./application-row-actions";
import { getApplicationStatusLabel } from "#/lib/status-labels";

export type Application = AdminApplicationListItem;

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACCEPTED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "CANCELLED":
      return "secondary";
    case "PENDING":
      return "outline";
    default:
      return "outline";
  }
}

const applicationDataColumns: ColumnDef<Application, unknown>[] = [
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
        <Badge variant={getStatusBadgeVariant(status)}>
          {getApplicationStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    id: "penaltyApplied",
    accessorKey: "penaltyApplied",
    header: "Penalty",
    cell: ({ row }) => {
      const applied = row.original.penaltyApplied;
      if (!applied)
        return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <Badge variant="destructive">
          {row.original.penaltyAmount?.toLocaleString() ?? "Yes"} FCFA
        </Badge>
      );
    },
  },
  {
    id: "cancellationReason",
    accessorKey: "cancellationReason",
    header: "Cancel reason",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm max-w-[150px] truncate block">
        {row.original.cancellationReason ?? "—"}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created at",
    cell: ({ row }) => {
      const v = row.original.createdAt;
      if (!v) return "—";
      try {
        return new Date(v).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        });
      } catch {
        return String(v);
      }
    },
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Updated at",
    cell: ({ row }) => {
      const v = row.original.updatedAt;
      if (!v) return "—";
      try {
        return new Date(v).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        });
      } catch {
        return String(v);
      }
    },
  },
];

export const applicationColumns = getCommonColumns<Application>({
  additionalColumns: applicationDataColumns,
  columnsActions: ({ row }) => <ApplicationRowActions application={row} />,
});
