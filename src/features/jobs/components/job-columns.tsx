import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminJobOfferListItem } from "#/lib/api/jobs-controller";
import { JobRowActions } from "./job-row-actions";
import { getJobOfferStatusLabel } from "#/lib/status-labels";

export type JobOffer = AdminJobOfferListItem;

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500 text-white border-transparent";
    case "PARTIALLY_FILLED":
      return "bg-cyan-500 text-white border-transparent";
    case "FILLED":
      return "bg-blue-600 text-white border-transparent";
    case "IN_PROGRESS":
      return "bg-indigo-500 text-white border-transparent";
    case "COMPLETED":
      return "bg-violet-600 text-white border-transparent";
    case "CANCELLED":
      return "bg-rose-500 text-white border-transparent";
    case "EXPIRED":
      return "bg-orange-500 text-white border-transparent";
    case "DRAFT":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getPaymentFlowBadgeClass(flow: string): string {
  switch (flow) {
    case "HOURLY":
      return "bg-sky-500/15 text-sky-700 border-sky-200 dark:text-sky-300 dark:border-sky-800";
    case "DAILY":
      return "bg-amber-500/15 text-amber-700 border-amber-200 dark:text-amber-300 dark:border-amber-800";
    case "FIXED":
      return "bg-purple-500/15 text-purple-700 border-purple-200 dark:text-purple-300 dark:border-purple-800";
    case "MONTHLY":
      return "bg-teal-500/15 text-teal-700 border-teal-200 dark:text-teal-300 dark:border-teal-800";
    default:
      return "bg-muted text-muted-foreground border-border";
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
        <span className="font-medium text-sm wrap-break-word whitespace-normal">
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
    id: "paymentFlow",
    accessorKey: "paymentFlow",
    header: "Payment",
    cell: ({ row }) => (
      <Badge className={getPaymentFlowBadgeClass(row.original.paymentFlow)}>
        {row.original.paymentFlow}
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
