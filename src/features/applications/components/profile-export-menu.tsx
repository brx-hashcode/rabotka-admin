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
import { profilesParsers, toWhatsappConnected } from "#/hooks/use-profiles-list";
import { fetchAllProfiles } from "#/lib/api/profiles-controller";
import {
  PROFILE_EXPORT_HEADERS,
  profileItemsToStringRows,
  profileItemsToTypedRows,
} from "#/lib/export/profile-export-rows";
import {
  buildXlsxBlob,
  downloadBlob,
  downloadTextFile,
  rowsToCsvString,
} from "#/lib/export/spreadsheet";

export function ProfileExportMenu() {
  const [qs] = useQueryStates(profilesParsers);
  const [busy, setBusy] = useState(false);

  const whatsappConnected = toWhatsappConnected(qs.whatsapp_connected ?? []);
  const filters = {
    ...(qs.q ? { q: qs.q } : {}),
    ...(qs.status?.length ? { status: qs.status } : {}),
    ...(qs.profile_type?.length ? { profile_type: qs.profile_type } : {}),
    ...(whatsappConnected === undefined
      ? {}
      : { whatsapp_connected: whatsappConnected }),
    ...(qs.verification_status?.length
      ? { verification_status: qs.verification_status }
      : {}),
    ...(qs.deleted?.includes("true") ? { deleted: true } : {}),
  };

  const dateStamp = format(new Date(), "yyyy-MM-dd");

  async function runExport(formatKind: "csv" | "xlsx") {
    setBusy(true);
    try {
      const items = await fetchAllProfiles(filters);
      const base = `profiles-${dateStamp}`;
      if (formatKind === "csv") {
        const csv = rowsToCsvString(
          [...PROFILE_EXPORT_HEADERS],
          profileItemsToStringRows(items),
        );
        downloadTextFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
      } else {
        const blob = buildXlsxBlob(
          [...PROFILE_EXPORT_HEADERS],
          profileItemsToTypedRows(items),
          "Profiles",
        );
        downloadBlob(blob, `${base}.xlsx`);
      }
      toast.success(`Exported ${items.length} profile(s)`);
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
