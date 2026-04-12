import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import { ProfileRowActions } from "./profile-row-actions";
import {
  getAccountStatusLabel,
  getProfileTypeLabel,
  getVerificationStatusLabel,
} from "#/lib/status-labels";

export type Profile = AdminProfileListItem;

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-500 text-white border-transparent";
    case "SUSPENDED":
      return "bg-amber-500 text-white border-transparent";
    case "BANNED":
      return "bg-rose-600 text-white border-transparent";
    case "PENDING_ACTIVATION":
      return "bg-sky-500/15 text-sky-700 border-sky-200 dark:text-sky-300 dark:border-sky-800";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function getVerificationStatusBadgeClass(status: string): string {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-500 text-white border-transparent";
    case "REJECTED":
      return "bg-rose-600 text-white border-transparent";
    case "PENDING":
      return "bg-amber-500/15 text-amber-700 border-amber-200 dark:text-amber-300 dark:border-amber-800";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getProfileTypeBadgeClass(type: string): string {
  switch (type) {
    case "EMPLOYER":
      return "bg-violet-600 text-white border-transparent";
    case "WORKER":
      return "bg-blue-500 text-white border-transparent";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

const profileDataColumns: ColumnDef<Profile, unknown>[] = [
  {
    id: "profile",
    accessorKey: "firstName",
    header: "Profile",
    cell: ({ row }) => {
      const p = row.original;
      const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
      return (
        <ProfileCell
          name={name}
          email={p.email ?? ""}
          avatarUrl={p.avatarUrl}
        />
      );
    },
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.phone ?? "—"}
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.original.status);
      return (
        <Badge className={getStatusBadgeClass(status)}>
          {getAccountStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    id: "profileType",
    accessorKey: "profileType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.profileType;
      return (
        <Badge className={getProfileTypeBadgeClass(type)}>
          {getProfileTypeLabel(type)}
        </Badge>
      );
    },
  },
  {
    id: "whatsappConnected",
    accessorKey: "whatsappConnected",
    header: "WhatsApp",
    cell: ({ row }) => {
      const connected = row.original.whatsappConnected;
      return (
        <Badge
          className={
            connected
              ? "bg-emerald-500 text-white border-transparent"
              : "bg-muted text-muted-foreground border-border"
          }
        >
          {connected ? "Connected" : "Disconnected"}
        </Badge>
      );
    },
  },
  {
    id: "verificationStatus",
    accessorKey: "verificationStatus",
    header: "Verification",
    cell: ({ row }) => {
      const status = String(row.original.verificationStatus ?? "");
      return (
        <Badge variant={getVerificationStatusBadgeVariant(status)}>
          {getVerificationStatusLabel(status) || "—"}
        </Badge>
      );
    },
  },
  {
    id: "reliabilityScore",
    accessorKey: "reliabilityScore",
    header: "Reliability score",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.reliabilityScore ?? "—"}</span>
    ),
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

export const profileColumns = getCommonColumns<Profile>({
  additionalColumns: profileDataColumns,
  columnsActions: ({ row }) => <ProfileRowActions profile={row} />,
});
