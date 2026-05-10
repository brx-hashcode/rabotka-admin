import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminPenaltyListItem } from "#/lib/api/penalties-controller";
import { PenaltyRowActions } from "./penalty-row-actions";

export type Penalty = AdminPenaltyListItem;

const penaltyDataColumns: ColumnDef<Penalty, unknown>[] = [
  {
    id: "profile",
    accessorKey: "profileName",
    header: "Profile",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.profileName}
        email={row.original.profileEmail}
        avatarUrl={row.original.profileAvatarUrl}
      />
    ),
  },
  {
    id: "jobTitle",
    accessorKey: "jobTitle",
    header: "Job",
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        <span className="font-medium text-sm wrap-break-word">
          {row.original.jobTitle ?? "—"}
        </span>
      </div>
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
    id: "reason",
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm max-w-[200px] truncate block">
        {row.original.reason ?? "—"}
      </span>
    ),
  },
  {
    id: "paymentStatus",
    accessorKey: "paidAt",
    header: "Payment",
    cell: ({ row }) => {
      const paid = row.original.paidAt != null;
      return (
        <Badge className={paid ? "bg-emerald-500 text-white border-transparent" : "bg-rose-600 text-white border-transparent"}>
          {paid ? "Paid" : "Unpaid"}
        </Badge>
      );
    },
  },
  {
    id: "appliedAt",
    accessorKey: "appliedAt",
    header: "Applied at",
    cell: ({ row }) => {
      const v = row.original.appliedAt;
      if (!v) return "—";
      try {
        return new Date(v).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        });
      } catch {
        return String(v);
      }
    },
  },
  {
    id: "paidAt",
    accessorKey: "paidAt",
    header: "Paid at",
    cell: ({ row }) => {
      const v = row.original.paidAt;
      if (!v) return "—";
      try {
        return new Date(v).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        });
      } catch {
        return String(v);
      }
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created at",
    cell: ({ row }) => {
      const v = row.original.createdAt;
      if (!v) return "—";
      try {
        return new Date(v).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        });
      } catch {
        return String(v);
      }
    },
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Updated at",
    cell: ({ row }) => {
      const v = row.original.updatedAt;
      if (!v) return "—";
      try {
        return new Date(v).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        });
      } catch {
        return String(v);
      }
    },
  },
];

export const penaltyColumns = getCommonColumns<Penalty>({
  additionalColumns: penaltyDataColumns,
  columnsActions: ({ row }) => <PenaltyRowActions penalty={row} />,
});
