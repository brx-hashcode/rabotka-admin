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
import { jobsParsers } from "#/hooks/use-jobs-list";
import { fetchAllJobOffers } from "#/lib/api/jobs-controller";
import {
  JOB_EXPORT_HEADERS,
  jobItemsToStringRows,
  jobItemsToTypedRows,
} from "#/lib/export/job-export-rows";
import {
  buildXlsxBlob,
  downloadBlob,
  downloadTextFile,
  rowsToCsvString,
} from "#/lib/export/spreadsheet";

export function JobExportMenu() {
  const [qs] = useQueryStates(jobsParsers);
  const [busy, setBusy] = useState(false);

  // Only the filters the admin list endpoint actually supports, so the export
  // is exactly what the table is showing (it ignores pagination on purpose —
  // an export covers every matching row, not the current page).
  const filters = {
    ...(qs.q ? { q: qs.q } : {}),
    ...(qs.status?.length ? { status: qs.status } : {}),
  };

  const dateStamp = format(new Date(), "yyyy-MM-dd");

  async function runExport(formatKind: "csv" | "xlsx") {
    setBusy(true);
    try {
      const items = await fetchAllJobOffers(filters);
      const base = `job-offers-${dateStamp}`;
      if (formatKind === "csv") {
        const csv = rowsToCsvString(
          [...JOB_EXPORT_HEADERS],
          jobItemsToStringRows(items),
        );
        downloadTextFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
      } else {
        const blob = buildXlsxBlob(
          [...JOB_EXPORT_HEADERS],
          jobItemsToTypedRows(items),
          "Job offers",
        );
        downloadBlob(blob, `${base}.xlsx`);
      }
      toast.success(`Exported ${items.length} job offer(s)`);
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
