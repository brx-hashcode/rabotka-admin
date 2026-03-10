import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import type { AdminApplicationPenaltyItem } from "#/lib/api/applications-controller";

import { DataTable } from "#/components/table";
import { Badge } from "#/components/ui/badge";

import { formatDateTime, formatAmount } from "../helpers";

const columns: ColumnDef<AdminApplicationPenaltyItem>[] = [
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {formatAmount(row.original.amount)}
      </span>
    ),
  },
  {
    id: "reason",
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="text-muted-foreground max-w-64 truncate text-sm">
        {row.original.reason || "—"}
      </span>
    ),
  },
  {
    id: "payment",
    header: "Payment",
    cell: ({ row }) => {
      const paid = row.original.paidAt != null;
      return (
        <Badge variant={paid ? "default" : "destructive"}>
          {paid ? "Paid" : "Unpaid"}
        </Badge>
      );
    },
  },
  {
    id: "appliedAt",
    accessorKey: "appliedAt",
    header: "Applied At",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDateTime(row.original.appliedAt)}
      </span>
    ),
  },
  {
    id: "paidAt",
    accessorKey: "paidAt",
    header: "Paid At",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {formatDateTime(row.original.paidAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <div className="hidden">Actions</div>,
    cell: ({ row }) => (
      <Link
        to="/penalties/$penaltyId"
        params={{ penaltyId: row.original.id }}
        className="text-primary text-xs hover:underline"
      >
        View
      </Link>
    ),
    enableSorting: false,
    size: 60,
  },
];

type Props = {
  penalties: AdminApplicationPenaltyItem[];
};

export function ApplicationPenaltiesTable({ penalties }: Readonly<Props>) {
  return (
    <DataTable
      data={penalties}
      columns={columns}
      header={
        <h3 className="text-base font-semibold">
          Penalties ({penalties.length})
        </h3>
      }
      emptyMessage="No penalties."
      getRowId={(row) => row.id}
    />
  );
}
