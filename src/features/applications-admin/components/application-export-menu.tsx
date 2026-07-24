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
import { applicationsParsers } from "#/hooks/use-applications-list";
import { fetchAllApplications } from "#/lib/api/applications-controller";
import {
  APPLICATION_EXPORT_HEADERS,
  applicationItemsToStringRows,
  applicationItemsToTypedRows,
} from "#/lib/export/application-export-rows";
import {
  buildXlsxBlob,
  downloadBlob,
  downloadTextFile,
  rowsToCsvString,
} from "#/lib/export/spreadsheet";

export function ApplicationExportMenu() {
  const [qs] = useQueryStates(applicationsParsers);
  const [busy, setBusy] = useState(false);

  // Same filters the table sends, minus pagination — an export covers every
  // matching row, not just the current page.
  const filters = {
    ...(qs.q ? { q: qs.q } : {}),
    ...(qs.status?.length ? { status: qs.status } : {}),
    ...(qs.penalty_applied?.length
      ? { penalty_applied: qs.penalty_applied }
      : {}),
  };

  const dateStamp = format(new Date(), "yyyy-MM-dd");

  async function runExport(formatKind: "csv" | "xlsx") {
    setBusy(true);
    try {
      const items = await fetchAllApplications(filters);
      const base = `applications-${dateStamp}`;
      if (formatKind === "csv") {
        const csv = rowsToCsvString(
          [...APPLICATION_EXPORT_HEADERS],
          applicationItemsToStringRows(items),
        );
        downloadTextFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
      } else {
        const blob = buildXlsxBlob(
          [...APPLICATION_EXPORT_HEADERS],
          applicationItemsToTypedRows(items),
          "Applications",
        );
        downloadBlob(blob, `${base}.xlsx`);
      }
      toast.success(`Exported ${items.length} application(s)`);
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
