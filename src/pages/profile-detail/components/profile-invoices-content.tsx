import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  IconDownload,
  IconGavel,
  IconLock,
  IconReceipt,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import type { IconProps } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
  getProfileInvoices,
  type AdminInvoiceItem,
} from "#/lib/api/profiles-controller";
import { downloadAdminInvoice } from "#/lib/api/wallet-controller";
import { groupByDay } from "#/lib/date-grouping";

const REASON_LABELS: Record<string, string> = {
  CONTACT_UNLOCK: "Contact unlock",
  PENALTY: "Penalty",
  OTHER: "Other",
};

const REASON_ICONS: Record<string, ComponentType<IconProps>> = {
  CONTACT_UNLOCK: IconLock,
  PENALTY: IconGavel,
};

/**
 * `PENDING_DOWNLOAD` is a state machine value, not a sentence.
 *
 * It was rendered raw, in a badge, on every row — so the loudest element in the
 * list said the same thing each time and said it in database language. What
 * matters to a reader is only whether the invoice has been fetched yet.
 */
const STATUS_LABELS: Record<string, string> = {
  PENDING_DOWNLOAD: "Not downloaded",
  DOWNLOADED: "Downloaded",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.toLowerCase().replaceAll("_", " ");
}

function amountOf(invoice: AdminInvoiceItem): number {
  const n = Number(invoice.amount);
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function InvoiceRow({ invoice }: Readonly<{ invoice: AdminInvoiceItem }>) {
  const [isDownloading, setIsDownloading] = useState(false);
  const Icon = REASON_ICONS[invoice.reason] ?? IconReceipt;
  const date = new Date(invoice.createdAt);
  const valid = !Number.isNaN(date.getTime());
  const downloaded = invoice.status === "DOWNLOADED";

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadAdminInvoice(
        invoice.id,
        `facture_${invoice.id.slice(0, 8)}.pdf`,
      );
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-6 py-3">
      <div className="text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {REASON_LABELS[invoice.reason] ?? invoice.reason}
        </p>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
          {valid && <span>{format(date, "HH:mm")}</span>}
          {valid && <span aria-hidden>·</span>}
          {valid && (
            <span title={format(date, "PPpp")}>
              {formatDistanceToNow(date, { addSuffix: true })}
            </span>
          )}
          {/* Only worth saying when it is still true — "Downloaded" on every
              settled row is noise, and the absence reads as fine. */}
          {!downloaded && (
            <>
              <span aria-hidden>·</span>
              <span>{statusLabel(invoice.status)}</span>
            </>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right font-mono text-sm tabular-nums">
        {formatAmount(amountOf(invoice))}
      </div>

      {/* A labelled button, not a bare red glyph: downloading is the only thing
          anyone comes to this tab to do, and an unlabelled icon made the
          primary action the least visible element on the row. */}
      <Button
        variant={downloaded ? "ghost" : "outline"}
        size="sm"
        className="shrink-0 gap-1.5"
        disabled={isDownloading}
        onClick={handleDownload}
        title={`Invoice ${invoice.id}`}
      >
        <IconDownload className="size-3.5" />
        PDF
      </Button>
    </div>
  );
}

type Props = {
  profileId: string;
};

export function ProfileInvoicesContent({ profileId }: Readonly<Props>) {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "invoices"],
    queryFn: () => getProfileInvoices(profileId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`invoice-skeleton-${i + 1}`} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const groups = groupByDay(invoices ?? [], (inv) => inv.createdAt);
  const total = (invoices ?? []).reduce((sum, inv) => sum + amountOf(inv), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">Invoices</CardTitle>
        {invoices && invoices.length > 0 && (
          // The two questions a list of near-identical invoices raises, and
          // neither was answerable without counting rows by hand.
          <span className="text-muted-foreground text-xs tabular-nums">
            {invoices.length} · {formatAmount(total)}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconReceipt className="text-muted-foreground mb-2 size-8" />
            <p className="text-muted-foreground text-sm">No invoices found.</p>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <section key={group.key}>
                <div className="bg-muted/40 text-muted-foreground sticky top-0 z-10 flex items-center justify-between px-6 py-1.5 text-xs font-medium">
                  <span>{group.heading}</span>
                  <span className="tabular-nums">
                    {formatAmount(
                      group.items.reduce((sum, inv) => sum + amountOf(inv), 0),
                    )}
                  </span>
                </div>
                <div className="divide-y">
                  {group.items.map((inv) => (
                    <InvoiceRow key={inv.id} invoice={inv} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
