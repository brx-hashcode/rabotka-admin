import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { getCommonColumns } from "#/components/table";
import type { WhatsappMessageItem } from "#/lib/api/whatsapp-controller";
import {
  WhatsappCategoryBadge,
  WhatsappStatusBadge,
} from "./whatsapp-status-badge";
import { WhatsappMessageRowActions } from "./whatsapp-message-row-actions";
import {
  messageKindLabel,
  sendErrorLabel,
  templateLabel,
} from "../labels";

export function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

const KIND_STYLE: Record<string, string> = {
  template: "bg-violet-600 text-white",
  text: "bg-blue-500 text-white",
  media: "bg-cyan-600 text-white",
  flow: "bg-teal-600 text-white",
  interactive: "bg-indigo-500 text-white",
  interactive_cta: "bg-indigo-500 text-white",
};

/** Which way the message went, readable at a glance down the column. */
function DirectionMark({
  direction,
}: Readonly<{ direction: WhatsappMessageItem["direction"] }>) {
  const inbound = direction === "INBOUND";
  return inbound ? (
    <ArrowDownLeft
      className="size-3.5 shrink-0 text-teal-600"
      aria-label="Received"
    />
  ) : (
    <ArrowUpRight
      className="text-muted-foreground size-3.5 shrink-0"
      aria-label="Sent"
    />
  );
}

const messageColumns: ColumnDef<WhatsappMessageItem, unknown>[] = [
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Time",
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "recipient",
    header: "Contact",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5 font-mono text-xs">
          <DirectionMark direction={row.original.direction} />
          {row.original.toPhone}
        </span>
        {row.original.profileName ? (
          <span className="text-muted-foreground text-xs">
            {row.original.profileName}
          </span>
        ) : row.original.waProfileName ? (
          // The name they chose on WhatsApp — for a number with no profile,
          // the only name we have. Labelled so it is not mistaken for one.
          <span className="text-muted-foreground text-xs">
            <span className="opacity-70">WhatsApp: </span>
            {row.original.waProfileName}
          </span>
        ) : (
          // Worth showing rather than leaving blank: a send to a number with
          // no profile is an OTP or an activation message, and that is exactly
          // the traffic the old `messages` table could not record at all.
          <span className="text-muted-foreground text-xs italic">
            no profile
          </span>
        )}
      </div>
    ),
  },
  {
    id: "template",
    header: "Type",
    cell: ({ row }) => {
      const { kind, templateKey } = row.original;
      return (
        <div className="flex flex-col gap-1">
          <Badge
            className={`w-fit border-transparent text-xs ${
              KIND_STYLE[kind] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {messageKindLabel(kind)}
          </Badge>
          {templateKey ? (
            <span className="text-xs">{templateLabel(templateKey)}</span>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "bodyPreview",
    header: "Content",
    cell: ({ row }) => (
      <span
        className="line-clamp-2 max-w-[28rem] text-sm"
        title={row.original.bodyPreview}
      >
        {row.original.bodyPreview}
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <WhatsappStatusBadge status={row.original.status} />,
  },
  {
    id: "templateCategory",
    header: "Category",
    cell: ({ row }) => (
      <WhatsappCategoryBadge
        // The webhook's pricing category is what Meta actually billed; the
        // template's own category is what we declared. Prefer the former when
        // it has arrived, because that is the one on the invoice.
        category={row.original.pricingCategory ?? row.original.templateCategory}
      />
    ),
  },
  {
    id: "error",
    header: "Problem",
    cell: ({ row }) => {
      const { errorCode, errorMessage } = row.original;
      if (!errorCode) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      return (
        <span
          className="line-clamp-2 max-w-[16rem] text-xs text-rose-600"
          title={errorMessage ?? undefined}
        >
          {sendErrorLabel(errorCode)}
        </span>
      );
    },
  },
  {
    id: "providerMessageId",
    header: "WhatsApp ref.",
    cell: ({ row }) =>
      row.original.providerMessageId ? (
        <span
          className="text-muted-foreground block max-w-[10rem] truncate font-mono text-xs"
          title={row.original.providerMessageId}
        >
          {row.original.providerMessageId}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  },
];

export function makeWhatsappMessageColumns(
  onView: (message: WhatsappMessageItem) => void,
) {
  return getCommonColumns<WhatsappMessageItem>({
    additionalColumns: messageColumns,
    columnsActions: ({ row }) => (
      <WhatsappMessageRowActions message={row} onView={onView} />
    ),
  });
}
