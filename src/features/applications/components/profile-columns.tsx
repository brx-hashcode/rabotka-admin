import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns } from "#/components/table";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import { ProfileRowActions } from "./profile-row-actions";
import {
  getAccountStatusLabel,
  getProfileTypeLabel,
  getVerificationStatusLabel,
} from "#/lib/status-labels";

export type Profile = AdminProfileListItem;

function getInitials(firstName: string, lastName: string): string {
  const a = firstName?.trim()[0] ?? "";
  const b = lastName?.trim()[0] ?? "";
  return (a + b).toUpperCase().slice(0, 2) || "?";
}

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
      const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—";
      const initials = getInitials(p.firstName ?? "", p.lastName ?? "");
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {p.avatarUrl ? (
              <AvatarImage
                src={p.avatarUrl}
                alt={name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="font-semibold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {p.email ?? "—"}
            </span>
          </div>
        </div>
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
