import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { getCommonColumns } from "#/components/table";
import {
  getReferralStatusBadgeClass,
  REFERRAL_STATUS_LABELS,
} from "#/lib/status-labels";
import type {
  AdminReferralItem,
  AdminReferralParty,
} from "#/lib/api/referral-controller";

const SOURCE_LABELS: Record<string, string> = {
  LINK: "Link",
  MANUAL_CODE: "Typed",
  BOT: "Bot",
  ADMIN: "Admin",
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

function formatAmount(v: number | null) {
  return v === null ? "—" : `${v.toLocaleString("fr-FR")} FCFA`;
}

function PartyCell({ party }: Readonly<{ party: AdminReferralParty }>) {
  return (
    <div className="min-w-0">
      <Link
        to="/profiles/$profileId"
        params={{ profileId: party.profileId }}
        className="block truncate text-sm font-medium hover:underline"
      >
        {party.firstName} {party.lastName}
      </Link>
      <span className="text-muted-foreground block truncate text-xs">
        {party.phone}
      </span>
    </div>
  );
}

const referralDataColumns: ColumnDef<AdminReferralItem, unknown>[] = [
  {
    id: "referrer",
    accessorKey: "referrer",
    header: "Referrer",
    cell: ({ row }) => <PartyCell party={row.original.referrer} />,
  },
  {
    id: "referee",
    accessorKey: "referee",
    header: "Referee",
    cell: ({ row }) => <PartyCell party={row.original.referee} />,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="space-y-1">
        <Badge
          className={`text-xs ${getReferralStatusBadgeClass(row.original.status)}`}
        >
          {REFERRAL_STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
        {/* The reason, right under the status. This is the whole point of the
            page: "not paid" is not an answer a support agent can give. */}
        {row.original.settlementNote && (
          <span className="text-muted-foreground block max-w-[220px] text-xs">
            {row.original.settlementNote}
          </span>
        )}
      </div>
    ),
  },
  {
    id: "codeUsed",
    accessorKey: "codeUsed",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.codeUsed}</span>
    ),
  },
  {
    id: "source",
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {SOURCE_LABELS[row.original.source] ?? row.original.source}
      </span>
    ),
  },
  {
    id: "payout",
    accessorKey: "referrerAmount",
    header: "Payout",
    cell: ({ row }) => (
      <div className="text-sm text-nowrap">
        <span className="font-medium">
          {formatAmount(row.original.referrerAmount)}
        </span>
        <span className="text-muted-foreground block text-xs">
          filleul {formatAmount(row.original.refereeAmount)}
        </span>
      </div>
    ),
  },
  {
    id: "qualifyingAmount",
    accessorKey: "qualifyingAmount",
    header: "Triggered by",
    cell: ({ row }) =>
      row.original.qualifyingAmount === null ? (
        <span className="text-muted-foreground text-sm">—</span>
      ) : (
        <div className="text-sm text-nowrap">
          {/* The payment that settled it. Shown beside the payout because the
              two together are the rule: a parrainage never pays more than the
              payment that triggered it brought in. */}
          <span>{formatAmount(row.original.qualifyingAmount)}</span>
          <span className="text-muted-foreground block text-xs">
            {row.original.qualifyingType ?? ""}
          </span>
        </div>
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
    id: "rewardedAt",
    accessorKey: "rewardedAt",
    header: "Rewarded At",
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">
        {formatDate(row.original.rewardedAt)}
      </span>
    ),
  },
];

export const referralColumns = getCommonColumns<AdminReferralItem>({
  additionalColumns: referralDataColumns,
});
