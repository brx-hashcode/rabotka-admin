import { useState } from "react";
import { useQueryStates } from "nuqs";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  walletPaymentsParsers,
  walletTransactionsParsers,
} from "#/hooks/wallet-query-parsers";
import {
  fetchAllWalletPayments,
  fetchAllWalletTransactions,
} from "#/lib/api/wallet-controller";
import {
  PAYMENT_EXPORT_HEADERS,
  TRANSACTION_EXPORT_HEADERS,
  paymentItemsToStringRows,
  paymentItemsToTypedRows,
  transactionItemsToStringRows,
  transactionItemsToTypedRows,
} from "#/lib/export/wallet-export-rows";
import {
  buildXlsxBlob,
  downloadBlob,
  downloadTextFile,
  rowsToCsvString,
} from "#/lib/export/spreadsheet";

import type { WalletTab } from "./wallet-tabs";

export function WalletExportMenu({
  activeTab,
}: Readonly<{ activeTab: WalletTab }>) {
  const [paymentQs] = useQueryStates(walletPaymentsParsers);
  const [txQs] = useQueryStates(walletTransactionsParsers);
  const [busy, setBusy] = useState(false);

  const paymentFilters = {
    ...(paymentQs.q ? { q: paymentQs.q } : {}),
    ...(paymentQs.pay_type?.length ? { type: paymentQs.pay_type } : {}),
    ...(paymentQs.pay_status?.length ? { status: paymentQs.pay_status } : {}),
    ...(paymentQs.created_from
      ? { created_from: paymentQs.created_from }
      : {}),
    ...(paymentQs.created_to ? { created_to: paymentQs.created_to } : {}),
  };

  const txFilters = {
    ...(txQs.q ? { q: txQs.q } : {}),
    ...(txQs.tx_type?.length ? { type: txQs.tx_type } : {}),
    ...(txQs.created_from ? { created_from: txQs.created_from } : {}),
    ...(txQs.created_to ? { created_to: txQs.created_to } : {}),
  };

  const dateStamp = format(new Date(), "yyyy-MM-dd");

  async function runExport(formatKind: "csv" | "xlsx") {
    setBusy(true);
    try {
      if (activeTab === "payments") {
        const items = await fetchAllWalletPayments(paymentFilters);
        const base = `payments-${dateStamp}`;
        if (formatKind === "csv") {
          const csv = rowsToCsvString(
            [...PAYMENT_EXPORT_HEADERS],
            paymentItemsToStringRows(items),
          );
          downloadTextFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
        } else {
          const blob = buildXlsxBlob(
            [...PAYMENT_EXPORT_HEADERS],
            paymentItemsToTypedRows(items),
            "Payments",
          );
          downloadBlob(blob, `${base}.xlsx`);
        }
        toast.success(`Exported ${items.length} payment(s)`);
      } else {
        const items = await fetchAllWalletTransactions(txFilters);
        const base = `transactions-${dateStamp}`;
        if (formatKind === "csv") {
          const csv = rowsToCsvString(
            [...TRANSACTION_EXPORT_HEADERS],
            transactionItemsToStringRows(items),
          );
          downloadTextFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
        } else {
          const blob = buildXlsxBlob(
            [...TRANSACTION_EXPORT_HEADERS],
            transactionItemsToTypedRows(items),
            "Transactions",
          );
          downloadBlob(blob, `${base}.xlsx`);
        }
        toast.success(`Exported ${items.length} transaction(s)`);
      }
    } catch {
      toast.error("Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Download className="size-4" aria-hidden />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          disabled={busy}
          onSelect={() => {
            void runExport("csv");
          }}
        >
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy}
          onSelect={() => {
            void runExport("xlsx");
          }}
        >
          Export Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
