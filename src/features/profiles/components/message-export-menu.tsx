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
import type { AdminProfileMessage } from "#/lib/api/profiles-controller";
import {
  MESSAGE_EXPORT_HEADERS,
  messageItemsToStringRows,
  messageItemsToTypedRows,
} from "#/lib/export/message-export-rows";
import {
  buildXlsxBlob,
  downloadBlob,
  downloadTextFile,
  rowsToCsvString,
} from "#/lib/export/spreadsheet";

/** Filename-safe slug of the profile name, so exports are identifiable on disk. */
function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      // Combining marks, written as escapes — the literal characters are
      // invisible in source and get mangled by any tool that touches encoding.
      .replaceAll(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/(^-|-$)/g, "")
      .slice(0, 40) || "profile"
  );
}

/**
 * Exports one profile's conversation.
 *
 * Takes the already-loaded messages rather than refetching: the thread is
 * fetched whole for the chat view, so a second request would only add a way for
 * the file to disagree with what is on screen.
 */
export function MessageExportMenu({
  messages,
  profileName,
}: Readonly<{
  messages: AdminProfileMessage[];
  profileName: string;
}>) {
  const [busy, setBusy] = useState(false);

  function runExport(formatKind: "csv" | "xlsx") {
    setBusy(true);
    try {
      const base = `chat-${slugify(profileName)}-${format(new Date(), "yyyy-MM-dd")}`;
      if (formatKind === "csv") {
        const csv = rowsToCsvString(
          [...MESSAGE_EXPORT_HEADERS],
          messageItemsToStringRows(messages, profileName),
        );
        downloadTextFile(csv, `${base}.csv`, "text/csv;charset=utf-8");
      } else {
        const blob = buildXlsxBlob(
          [...MESSAGE_EXPORT_HEADERS],
          messageItemsToTypedRows(messages, profileName),
          "Chat",
        );
        downloadBlob(blob, `${base}.xlsx`);
      }
      toast.success(`Exported ${messages.length} message(s)`);
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
          variant="ghost"
          size="sm"
          className="gap-1.5 h-7 px-2"
          disabled={busy || messages.length === 0}
          aria-label="Export conversation"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Download className="size-3.5" aria-hidden />
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
