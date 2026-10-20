import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminJobOfferListItem } from "#/lib/api/jobs-controller";
import { JobRowActions } from "./job-row-actions";
import { getJobOfferStatusLabel } from "#/lib/status-labels";
import { EMPLOYMENT_TYPE_LABELS } from "#/lib/employment-type";

export type JobOffer = AdminJobOfferListItem;

export function getStatusBadgeClass(status: string): string {
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
      return "bg-sky-500 text-white border-transparent";
    case "DAILY":
      return "bg-amber-500 text-white border-transparent";
    case "TASK":
      return "bg-purple-600 text-white border-transparent";
    case "MONTHLY":
      return "bg-teal-600 text-white border-transparent";
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
    id: "reference",
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => (
      <code className="text-xs font-mono rounded bg-muted px-1.5 py-0.5">
        {row.original.reference}
      </code>
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
    cell: ({ row }) => {
      const paymentFlow = row.original.paymentFlow;
      if (!paymentFlow) return "—";

      return (
        <Badge className={getPaymentFlowBadgeClass(paymentFlow)}>
          {paymentFlow}
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
      // The amount field is optional at creation, and 0 means "no price set",
      // not "pays nothing" — the client shows «À négocier» for the same row.
      if (amount == null || amount === 0) return "—";

      return (
        <span className="text-sm font-medium">
          {amount.toLocaleString()} FCFA
        </span>
      );
    },
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
    id: "employmentType",
    accessorKey: "employmentType",
    header: "Type",
    cell: ({ row }) => {
      const v = row.original.employmentType;
      return (
        <span className="text-sm">
          {EMPLOYMENT_TYPE_LABELS[v] ?? v ?? "Mission"}
        </span>
      );
    },
  },
  {
    id: "scheduledAt",
    accessorKey: "scheduledAt",
    header: "Closing date",
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
