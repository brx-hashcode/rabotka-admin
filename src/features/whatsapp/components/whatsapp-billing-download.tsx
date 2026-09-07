import { useState } from "react";
import { IconDownload, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { downloadBlob } from "#/lib/export/spreadsheet";
import { getWhatsappBillingReportPdf } from "#/lib/api/whatsapp-controller";
import { useWhatsappRange } from "#/hooks/use-whatsapp-analytics";
import { describeRange } from "./whatsapp-range-toggle";

/**
 * The consumption tab, as a document to keep.
 *
 * It exports the window the page is already showing rather than opening a
 * picker of its own. The tab has one window — presets and the date pickers
 * write the same two URL params — and a second control here could disagree
 * with the figures on screen, which is the one thing a downloaded report must
 * never do. The button says which window it will render for that reason.
 *
 * Rendered server-side (Puppeteer), so this waits on a real request: the
 * button owns a busy state rather than pretending the file is instant.
 */
export function WhatsappBillingDownload() {
  const range = useWhatsappRange();
  const [busy, setBusy] = useState(false);

  const windowLabel = describeRange(
    range.created_from ?? "",
    range.created_to ?? "",
  );

  async function handleDownload() {
    setBusy(true);
    try {
      const { blob, filename } = await getWhatsappBillingReportPdf(range);
      downloadBlob(blob, filename);
      toast.success(`Consumption report for ${windowLabel} downloaded`);
    } catch (err) {
      // The backend says WHY — wrong provider, Graph unreachable, Chromium
      // missing — and every one of those needs a different response from the
      // reader, so the message is passed through rather than flattened.
      toast.error(
        err instanceof Error ? err.message : "The report could not be generated.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 shrink-0"
      disabled={busy}
      onClick={() => void handleDownload()}
      title={`Download the consumption report for ${windowLabel}`}
    >
      {busy ? (
        <IconLoader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <IconDownload className="size-4" aria-hidden />
      )}
      {busy ? "Preparing PDF…" : "Download PDF"}
    </Button>
  );
}
