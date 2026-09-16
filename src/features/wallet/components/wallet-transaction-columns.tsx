import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "#/components/ui/badge";
import { getCommonColumns } from "#/components/table";
import type { AdminWalletTransactionItem } from "#/lib/api/wallet-controller";
import { recordTypeLabel } from "#/lib/log-labels";

const TX_TYPE_LABELS: Record<string, string> = {
  CREDIT_PENALTY: "Penalty",
  CREDIT_REGISTRATION: "Registration",
  CREDIT_JOB_POSTING: "Job Posting",
  CREDIT_COMMISSION: "Commission",
  WELCOME_CREDIT: "Welcome Credit",
  REFERRAL_CREDIT: "Referral Credit",
  CONTACT_UNLOCK_DEBIT: "Contact Unlock",
  CONTACT_UNLOCK_CREDIT: "Contact Unlock Refund",
  CONTACT_UNLOCK_CREDIT_CONVERSION: "Unlock Expired",
  MOBILE_MONEY_TOPUP: "Top-up",
  PENALTY_DEBIT: "Penalty Debit",
  JOB_POSTING_DEBIT: "Job Posting Fee",
  JOB_POSTING_PAYMENT: "Job Posting Payment",
  REGISTRATION_PAYMENT: "Registration Fee",
  PENALTY_PAYMENT: "Penalty Payment",
  CREDIT: "Credit",
  DEBIT: "Debit",
};

function getTxTypeBadgeClass(type: string): string {
  if (type.includes("PENALTY")) return "bg-orange-600 text-white border-transparent";
  if (type.includes("CONTACT_UNLOCK_DEBIT") || type.includes("DEBIT") || type.includes("_DEBIT")) return "bg-orange-500 text-white border-transparent";
  if (type.includes("TOPUP") || type.includes("CREDIT") || type.includes("WELCOME")) return "bg-emerald-500 text-white border-transparent";
  if (type.includes("JOB_POSTING")) return "bg-blue-500 text-white border-transparent";
  if (type.includes("REGISTRATION")) return "bg-violet-600 text-white border-transparent";
  if (type.includes("COMMISSION")) return "bg-teal-600 text-white border-transparent";
  return "bg-muted text-muted-foreground border-border";
}

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
        <Badge className={`text-xs ${getTxTypeBadgeClass(row.original.type)}`}>
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
      header: "Linked to",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {recordTypeLabel(row.original.referenceType ?? null)}
        </span>
      ),
    },
    {
      id: "referenceId",
      accessorKey: "referenceId",
      header: "Reference",
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
