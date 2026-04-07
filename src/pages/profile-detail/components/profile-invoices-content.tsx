import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconFileTypePdf, IconReceipt } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Badge } from "#/components/ui/badge";
import { appConfig } from "#/config";
import { getCsrfToken } from "#/lib/api/csrf-token";

type AdminInvoiceItem = {
  id: string;
  profileId: string;
  paymentRequestId: string;
  amount: string;
  reason: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  status: string;
  createdAt: string;
};

async function fetchProfileInvoices(profileId: string): Promise<AdminInvoiceItem[]> {
  const token = getCsrfToken();
  const headers: Record<string, string> = token ? { "x-csrf-token": token } : {};
  const res = await fetch(`${appConfig.apiUrl}/admin/profiles/${profileId}/invoices`, {
    credentials: "include",
    headers,
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

async function downloadAdminInvoice(invoiceId: string, filename: string) {
  const token = getCsrfToken();
  const headers: Record<string, string> = token ? { "x-csrf-token": token } : {};
  const res = await fetch(`${appConfig.apiUrl}/admin/invoices/${invoiceId}/download`, {
    credentials: "include",
    headers,
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = globalThis.document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

const REASON_LABELS: Record<string, string> = {
  CONTACT_UNLOCK: "Contact unlock",
  PENALTY: "Penalty",
  OTHER: "Other",
};

function formatDate(v: string) {
  try {
    return new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return v;
  }
}

function InvoiceRow({ invoice }: Readonly<{ invoice: AdminInvoiceItem }>) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadAdminInvoice(invoice.id, `facture_${invoice.id.slice(0, 8)}.pdf`);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {REASON_LABELS[invoice.reason] ?? invoice.reason}
        </p>
        <p className="text-muted-foreground text-xs">{formatDate(invoice.createdAt)}</p>
        <p className="text-muted-foreground text-xs">
          {Number(invoice.amount).toLocaleString("fr-FR")} FCFA
        </p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        <Badge variant={invoice.status === "DOWNLOADED" ? "secondary" : "outline"} className="text-xs">
          {invoice.status}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          disabled={isDownloading}
          onClick={handleDownload}
          title="Download invoice PDF"
        >
          <IconFileTypePdf className="size-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}

type Props = {
  profileId: string;
};

export function ProfileInvoicesContent({ profileId }: Readonly<Props>) {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "invoices"],
    queryFn: () => fetchProfileInvoices(profileId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Invoices</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!invoices || invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconReceipt className="text-muted-foreground mb-2 size-8" />
            <p className="text-muted-foreground text-sm">No invoices found.</p>
          </div>
        ) : (
          <div className="divide-y">
            {invoices.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
