import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "#/components/ui/badge";
import { getCommonColumns } from "#/components/table";
import type { AdminWalletTransactionItem } from "#/lib/api/wallet-controller";

const TX_TYPE_LABELS: Record<string, string> = {
  CREDIT_PENALTY: "Penalty",
  CREDIT_REGISTRATION: "Registration",
  CREDIT_JOB_POSTING: "Job Posting",
  CREDIT_COMMISSION: "Commission",
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

const transactionDataColumns: ColumnDef<AdminWalletTransactionItem, unknown>[] =
  [
    {
      id: "type",
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-xs">
          {TX_TYPE_LABELS[row.original.type] ?? row.original.type}
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
      id: "referenceType",
      accessorKey: "referenceType",
      header: "Ref. Type",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground capitalize">
          {row.original.referenceType ?? "—"}
        </span>
      ),
    },
    {
      id: "referenceId",
      accessorKey: "referenceId",
      header: "Ref. ID",
      cell: ({ row }) =>
        row.original.referenceId ? (
          <span className="font-mono text-xs text-muted-foreground truncate block max-w-[140px]">
            {row.original.referenceId}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <span className="text-sm text-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

export const walletTransactionColumns =
  getCommonColumns<AdminWalletTransactionItem>({
    additionalColumns: transactionDataColumns,
  });
