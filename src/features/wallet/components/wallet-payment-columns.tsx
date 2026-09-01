import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { IconFileTypePdf } from "@tabler/icons-react";
import { toast } from "sonner";
import { getCommonColumns, ProfileCell } from "#/components/table";
import type { AdminPaymentItem } from "#/lib/api/wallet-controller";
import { fetchAdminInvoiceBlob } from "#/lib/api/wallet-controller";
import { getProfileInvoices } from "#/lib/api/profiles-controller";
import { DocumentViewerDrawer } from "#/pages/profile-detail/components/document-viewer-drawer";
import type { ViewerDocument } from "#/pages/profile-detail/components/document-viewer-drawer";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-500 text-white border-transparent",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-500 text-white border-transparent",
  },
  FAILED: {
    label: "Failed",
    className: "bg-rose-600 text-white border-transparent",
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-sky-500 text-white border-transparent",
  },
};

const TYPE_BADGE: Record<string, string> = {
  REGISTRATION: "bg-violet-600 text-white border-transparent",
  JOB_POSTING: "bg-blue-500 text-white border-transparent",
  PENALTY: "bg-orange-600 text-white border-transparent",
  CONTACT_UNLOCK: "bg-teal-600 text-white border-transparent",
  // Money coming IN, so it reads green rather than borrowing an outgoing
  // colour. Without an entry here a top-up fell through to the muted default.
  WALLET_TOP_UP: "bg-emerald-600 text-white border-transparent",
};

const METHOD_BADGE: Record<string, string> = {
  MOBILE_MONEY: "bg-orange-500 text-white border-transparent",
  CARD: "bg-indigo-500 text-white border-transparent",
  WALLET: "bg-cyan-600 text-white border-transparent",
  OTHER: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABELS: Record<string, string> = {
  REGISTRATION: "Registration",
  JOB_POSTING: "Job Posting",
  PENALTY: "Penalty",
  CONTACT_UNLOCK: "Contact Unlock",
  // Missing until now, so a wallet recharge rendered as the raw enum.
  WALLET_TOP_UP: "Wallet Top-up",
};

const METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  CARD: "Card",
  WALLET: "Wallet",
  OTHER: "Other",
};

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(v);
  }
}

function InvoicePreviewCell({
  payment,
}: Readonly<{ payment: AdminPaymentItem }>) {
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ViewerDocument | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (payment.status !== "COMPLETED") return null;

  async function handlePreview() {
    setLoading(true);
    try {
      const invoices = await getProfileInvoices(payment.profileId);
      const match = invoices.find(
        (inv) => Number(inv.amount) === payment.amount,
      );
      if (!match) {
        toast.error("No invoice found for this payment");
        return;
      }
      const blob = await fetchAdminInvoiceBlob(match.id);
      const objectUrl = URL.createObjectURL(blob);
      const filename = `facture_${match.id.slice(0, 8)}.pdf`;
      setPreviewDoc({
        url: objectUrl,
        title: "Invoice",
        description: filename,
        fileType: "pdf",
        onDownload: () => {
          const a = globalThis.document.createElement("a");
          a.href = objectUrl;
          a.download = filename;
          a.click();
        },
      });
      setDrawerOpen(true);
    } catch {
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(open: boolean) {
    setDrawerOpen(open);
    if (!open && previewDoc) {
      URL.revokeObjectURL(previewDoc.url);
      setPreviewDoc(null);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        disabled={loading}
        onClick={handlePreview}
        title="Preview invoice PDF"
      >
        <IconFileTypePdf className="size-4 text-red-500" />
        <span>invoice</span>
      </Button>
      <DocumentViewerDrawer
        open={drawerOpen}
        onOpenChange={handleOpenChange}
        document={previewDoc}
      />
    </>
  );
}

const paymentDataColumns: ColumnDef<AdminPaymentItem, unknown>[] = [
  {
    id: "profile",
    header: "Profile",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.profileName ?? "—"}
        email={row.original.profileEmail ?? ""}
        avatarUrl={null}
      />
    ),
  },
  {
    id: "type",
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        className={`text-xs ${TYPE_BADGE[row.original.type] ?? "bg-muted text-muted-foreground border-border"}`}
      >
        {TYPE_LABELS[row.original.type] ?? row.original.type}
      </Badge>
    ),
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original.amount.toLocaleString()} FCFA
      </span>
    ),
  },
  {
    id: "paymentMethod",
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }) => (
      <Badge
        className={`text-xs ${METHOD_BADGE[row.original.paymentMethod] ?? "bg-muted text-muted-foreground border-border"}`}
      >
        {METHOD_LABELS[row.original.paymentMethod] ??
          row.original.paymentMethod}
      </Badge>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const cfg = STATUS_BADGE[row.original.status] ?? {
        label: row.original.status,
        className: "bg-muted text-muted-foreground border-border",
      };
      return <Badge className={cfg.className}>{cfg.label}</Badge>;
    },
  },
  {
    id: "transactionId",
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground truncate block max-w-[140px]">
        {row.original.transactionId}
      </span>
    ),
  },
  {
    id: "paidAt",
    accessorKey: "paidAt",
    header: "Paid At",
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">
        {formatDate(row.original.paidAt)}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "invoice",
    header: "Invoice",
    cell: ({ row }) => <InvoicePreviewCell payment={row.original} />,
  },
];

export const walletPaymentColumns = getCommonColumns<AdminPaymentItem>({
  additionalColumns: paymentDataColumns,
});
