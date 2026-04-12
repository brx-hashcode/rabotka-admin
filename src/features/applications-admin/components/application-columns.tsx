import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminApplicationListItem } from "#/lib/api/applications-controller";
import { ApplicationRowActions } from "./application-row-actions";
import { getApplicationStatusLabel } from "#/lib/status-labels";

export type Application = AdminApplicationListItem;

export function getAppStatusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-500 text-white border-transparent";
    case "ACCEPTED":
      return "bg-emerald-500 text-white border-transparent";
    case "STARTED":
      return "bg-blue-500 text-white border-transparent";
    case "COMPLETED":
      return "bg-violet-600 text-white border-transparent";
    case "REJECTED":
      return "bg-rose-600 text-white border-transparent";
    case "CANCELLED":
      return "bg-orange-500 text-white border-transparent";
    default:
      return "bg-muted text-muted-foreground border-border";
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
        <span className="font-medium text-sm wrap-break-word whitespace-normal">
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
    id: "penaltyApplied",
    accessorKey: "penaltyApplied",
    header: "Penalty",
    cell: ({ row }) => {
      const applied = row.original.penaltyApplied;
      if (!applied)
        return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <Badge className="bg-rose-600 text-white border-transparent">
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
