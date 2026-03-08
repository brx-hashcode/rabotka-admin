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

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "BANNED":
      return "destructive";
    case "SUSPENDED":
      return "secondary";
    default:
      return "outline";
  }
}

function getVerificationStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "VERIFIED":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
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
        <Badge variant={getStatusBadgeVariant(status)}>
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
      const variant = type === "EMPLOYER" ? "default" : "secondary";
      return <Badge variant={variant}>{getProfileTypeLabel(type)}</Badge>;
    },
  },
  {
    id: "whatsappConnected",
    accessorKey: "whatsappConnected",
    header: "WhatsApp",
    cell: ({ row }) => {
      const connected = row.original.whatsappConnected;
      return (
        <Badge variant={connected ? "default" : "outline"}>
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
