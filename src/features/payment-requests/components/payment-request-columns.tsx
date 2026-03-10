import type { ColumnDef } from "@tanstack/react-table";
import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminPaymentRequestListItem } from "#/lib/api/payment-requests-controller";
import { PaymentRequestRowActions } from "./payment-request-row-actions";

export type PaymentRequest = AdminPaymentRequestListItem;

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(v);
  }
}

const paymentRequestDataColumns: ColumnDef<PaymentRequest, unknown>[] = [
  {
    id: "profile",
    accessorKey: "profileName",
    header: "Profile",
    cell: ({ row }) => (
      <ProfileCell
        name={row.getValue("profileName")}
        email={row.original.profileEmail}
      />
    ),
  },
  {
    id: "profileType",
    accessorKey: "profileType",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.profileType}
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const cfg = STATUS_BADGE[status] ?? {
        label: status,
        variant: "secondary" as const,
      };
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
  {
    id: "paymentReference",
    accessorKey: "paymentReference",
    header: "Reference",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.paymentReference ?? "—"}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created at",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Updated at",
    cell: ({ row }) => formatDate(row.original.updatedAt),
  },
];

export const paymentRequestColumns = getCommonColumns<PaymentRequest>({
  additionalColumns: paymentRequestDataColumns,
  columnsActions: ({ row }) => (
    <PaymentRequestRowActions request={row} />
  ),
});
