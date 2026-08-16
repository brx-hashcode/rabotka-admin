import { useState } from "react";
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
import type { AdminJobCategory } from "#/lib/api/job-categories-controller";
import {
  CATEGORY_EXPORT_HEADERS,
  categoryItemsToStringRows,
  categoryItemsToTypedRows,
} from "#/lib/export/category-export-rows";
import {
  buildXlsxBlob,
  downloadBlob,
  downloadTextFile,
  rowsToCsvString,
} from "#/lib/export/spreadsheet";

/**
 * Exports whatever the page is currently showing.
 *
 * Takes the rows as a prop rather than refetching, unlike the profile and job
 * exports: the whole domain list already arrives in one unpaginated request
 * and is filtered client-side, so there is nothing to page through and a
 * refetch would only risk exporting something other than what is on screen.
 */
export function CategoryExportMenu({
  categories,
  disabled,
}: {
  categories: AdminJobCategory[];
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const dateStamp = format(new Date(), "yyyy-MM-dd");

  function runExport(formatKind: "csv" | "xlsx") {
    setBusy(true);
    try {
      const base = `domains-${dateStamp}`;
      if (formatKind === "csv") {
        const csv = rowsToCsvString(
          [...CATEGORY_EXPORT_HEADERS],
          categoryItemsToStringRows(categories),
        );
        downloadTextFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
      } else {
        const blob = buildXlsxBlob(
          [...CATEGORY_EXPORT_HEADERS],
          categoryItemsToTypedRows(categories),
          "Domains",
        );
        downloadBlob(blob, `${base}.xlsx`);
      }
      toast.success(`Exported ${categories.length} domain(s)`);
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
          disabled={busy || disabled || categories.length === 0}
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
            runExport("csv");
          }}
        >
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy}
          onSelect={() => {
            runExport("xlsx");
          }}
        >
          Export Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
