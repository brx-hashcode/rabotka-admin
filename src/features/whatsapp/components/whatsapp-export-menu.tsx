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
import { whatsappMessagesParsers } from "#/hooks/use-whatsapp-messages-list";
import { fetchAllWhatsappMessages } from "#/lib/api/whatsapp-controller";
import {
  WHATSAPP_EXPORT_HEADERS,
  whatsappItemsToStringRows,
  whatsappItemsToTypedRows,
} from "#/lib/export/whatsapp-export-rows";
import {
  buildXlsxBlob,
  downloadBlob,
  downloadTextFile,
  rowsToCsvString,
} from "#/lib/export/spreadsheet";

export function WhatsappExportMenu() {
  const [qs] = useQueryStates(whatsappMessagesParsers);
  const [busy, setBusy] = useState(false);

  // Only the filters the admin list endpoint actually supports, so the export
  // is exactly what the table is showing (it ignores pagination on purpose —
  // an export covers every matching row, not the current page).
  const filters = {
    ...(qs.q ? { q: qs.q } : {}),
    ...(qs.status?.length ? { status: qs.status } : {}),
    ...(qs.template_key?.length ? { template_key: qs.template_key } : {}),
    ...(qs.kind?.length ? { kind: qs.kind } : {}),
    ...(qs.provider?.length ? { provider: qs.provider } : {}),
    ...(qs.created_from ? { created_from: qs.created_from } : {}),
    ...(qs.created_to ? { created_to: qs.created_to } : {}),
  };

  const dateStamp = format(new Date(), "yyyy-MM-dd");

  async function runExport(formatKind: "csv" | "xlsx") {
    setBusy(true);
    try {
      const items = await fetchAllWhatsappMessages(filters);
      const base = `whatsapp-messages-${dateStamp}`;
      if (formatKind === "csv") {
        const csv = rowsToCsvString(
          [...WHATSAPP_EXPORT_HEADERS],
          whatsappItemsToStringRows(items),
        );
        downloadTextFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
      } else {
        const blob = buildXlsxBlob(
          [...WHATSAPP_EXPORT_HEADERS],
          whatsappItemsToTypedRows(items),
          "WhatsApp messages",
        );
        downloadBlob(blob, `${base}.xlsx`);
      }
      toast.success(`Exported ${items.length} message(s)`);
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
