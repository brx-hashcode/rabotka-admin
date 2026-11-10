import type { ColumnDef } from "@tanstack/react-table";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  EyeIcon,
  MailIcon,
  MessageCircleIcon,
  MoreHorizontal,
  PhoneIcon,
} from "lucide-react";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type {
  AdminDemoRequest,
  DemoRequestStatus,
} from "#/lib/api/demo-requests-controller";

export type DemoRequest = AdminDemoRequest;

export const DEMO_STATUS_LABELS: Record<DemoRequestStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  DEMO_DONE: "Demo done",
  WON: "Won",
  LOST: "Lost",
};

export const demoStatusOptions = (
  Object.keys(DEMO_STATUS_LABELS) as DemoRequestStatus[]
).map((value) => ({ value, label: DEMO_STATUS_LABELS[value] }));

export function getDemoStatusBadgeClass(status: DemoRequestStatus): string {
  switch (status) {
    case "NEW":
      return "bg-blue-500 text-white border-transparent";
    case "CONTACTED":
      return "bg-amber-500 text-white border-transparent";
    case "DEMO_DONE":
      return "bg-violet-600 text-white border-transparent";
    case "WON":
      return "bg-emerald-600 text-white border-transparent";
    case "LOST":
      return "bg-zinc-500 text-white border-transparent";
  }
}

/** The business site's feature slugs, as admin reads them. */
export const DEMO_INTEREST_LABELS: Record<string, string> = {
  "analyse-cv": "CV analysis",
  "offres-candidatures": "Offers & applications",
  entretiens: "Interviews",
  missions: "Missions",
  "trouver-des-profils": "Profile search",
  equipe: "Team",
};

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

/** The number as it is dialled, with its international prefix. */
export function displayPhone(phone: string): string {
  const p = phone.trim();
  return p.startsWith("+") ? p : `+${p}`;
}

const dataColumns: ColumnDef<DemoRequest, unknown>[] = [
  {
    id: "company",
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => (
      <Link
        to="/demo-requests/$demoRequestId"
        params={{ demoRequestId: row.original.id }}
        className="block max-w-[260px] hover:opacity-80"
      >
        <ProfileCell
          name={row.original.company}
          email={`${row.original.countryName} · ${row.original.companySize} employees`}
        />
      </Link>
    ),
  },
  {
    id: "contact",
    accessorKey: "lastName",
    header: "Contact",
    cell: ({ row }) => (
      <div className="max-w-[240px] text-sm leading-tight">
        <p className="truncate font-medium">
          {row.original.lastName} {row.original.firstName}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {row.original.jobTitle} · {row.original.email}
        </p>
      </div>
    ),
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">
        {displayPhone(row.original.phone)}
      </span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={getDemoStatusBadgeClass(row.original.status)}>
        {DEMO_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Requested",
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
];

/** View, then the three ways to answer — as the agents' row menu. */
function DemoRequestRowActions({ row }: Readonly<{ row: DemoRequest }>) {
  const navigate = useNavigate();
  const phone = row.phone.replace(/\D/g, "");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Demo request actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            void navigate({
              to: "/demo-requests/$demoRequestId",
              params: { demoRequestId: row.id },
            })
          }
        >
          <EyeIcon className="size-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.open(`tel:+${phone}`, "_self")}>
          <PhoneIcon className="size-4" />
          Call
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(`https://wa.me/${phone}`, "_blank", "noreferrer")}
        >
          <MessageCircleIcon className="size-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(`mailto:${row.email}`, "_self")}
        >
          <MailIcon className="size-4" />
          E-mail
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const demoRequestColumns = getCommonColumns<DemoRequest>({
  additionalColumns: dataColumns,
  columnsActions: DemoRequestRowActions,
});
