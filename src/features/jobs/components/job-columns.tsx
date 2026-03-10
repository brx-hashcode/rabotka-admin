import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminJobOfferListItem } from "#/lib/api/jobs-controller";
import { JobRowActions } from "./job-row-actions";
import {
  getJobOfferStatusLabel,
  getPaymentFlowLabel,
} from "#/lib/status-labels";

export type JobOffer = AdminJobOfferListItem;

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "FILLED":
      return "outline";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

const jobDataColumns: ColumnDef<JobOffer, unknown>[] = [
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
        <Badge variant={getStatusBadgeVariant(status)}>
          {getJobOfferStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    id: "paymentFlow",
    accessorKey: "paymentFlow",
    header: "Payment",
    cell: ({ row }) => (
      <Badge variant="outline">
        {getPaymentFlowLabel(row.original.paymentFlow)}
      </Badge>
    ),
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original.amount.toLocaleString()} FCFA
      </span>
    ),
  },
  {
    id: "quantity",
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => <span className="text-sm">{row.original.quantity}</span>,
  },
  {
    id: "applicationsCount",
    accessorKey: "applicationsCount",
    header: "Applications",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.applicationsCount}</span>
    ),
  },
  {
    id: "scheduledAt",
    accessorKey: "scheduledAt",
    header: "Scheduled at",
    cell: ({ row }) => {
      const v = row.original.scheduledAt;
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

export const jobColumns = getCommonColumns<JobOffer>({
  additionalColumns: jobDataColumns,
  columnsActions: ({ row }) => <JobRowActions job={row} />,
});
