import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import {
  getJobOffersList,
  type AdminJobOfferListItem,
} from "#/lib/api/jobs-controller";
import {
  getJobOfferStatusLabel,
  getPaymentFlowLabel,
} from "#/lib/status-labels";

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
        <Badge variant={getStatusBadgeVariant(status)}>
          {getJobOfferStatusLabel(status)}
        </Badge>
      );
    },
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

export function RecentJobsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "recent-jobs"],
    queryFn: () => getJobOffersList({ page: 1, limit: 8 }),
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
