import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "#/components/ui/badge";
import { getCommonColumns, ProfileCell } from "#/components/table";
import type { AdminPaymentItem } from "#/lib/api/wallet-controller";

const STATUS_BADGE: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "outline" },
};

const TYPE_LABELS: Record<string, string> = {
  REGISTRATION: "Registration",
  JOB_POSTING: "Job Posting",
  PENALTY: "Penalty",
};

const METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  CARD: "Card",
  OTHER: "Other",
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

const paymentDataColumns: ColumnDef<AdminPaymentItem, unknown>[] = [
  {
    id: "profile",
    header: "Profile",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.profileName ?? "—"}
        email={row.original.profileEmail ?? ""}
        avatarUrl={null}
      />
    ),
  },
  {
    id: "type",
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {TYPE_LABELS[row.original.type] ?? row.original.type}
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
    id: "paymentMethod",
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {METHOD_LABELS[row.original.paymentMethod] ?? row.original.paymentMethod}
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const cfg = STATUS_BADGE[row.original.status] ?? {
        label: row.original.status,
        variant: "secondary" as const,
      };
      return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
    },
  },
  {
    id: "transactionId",
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground truncate block max-w-[140px]">
        {row.original.transactionId}
      </span>
    ),
  },
  {
    id: "paidAt",
    accessorKey: "paidAt",
    header: "Paid At",
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">{formatDate(row.original.paidAt)}</span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">{formatDate(row.original.createdAt)}</span>
    ),
  },
];

export const walletPaymentColumns = getCommonColumns<AdminPaymentItem>({
  additionalColumns: paymentDataColumns,
});
