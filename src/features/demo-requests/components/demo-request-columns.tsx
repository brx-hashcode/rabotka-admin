import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { EyeIcon } from "lucide-react";

import { getCommonColumns } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
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

const dataColumns: ColumnDef<DemoRequest, unknown>[] = [
  {
    id: "company",
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => (
      <div className="max-w-[220px]">
        <p className="font-medium text-sm wrap-break-word whitespace-normal">
          {row.original.company}
        </p>
        <p className="text-muted-foreground text-xs">
          {row.original.countryName} · {row.original.companySize} people
        </p>
      </div>
    ),
  },
  {
    id: "contact",
    accessorKey: "lastName",
    header: "Contact",
    cell: ({ row }) => (
      <div className="max-w-[220px]">
        <p className="font-medium text-sm">
          {row.original.firstName} {row.original.lastName}
        </p>
        <p className="text-muted-foreground text-xs wrap-break-word whitespace-normal">
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
      <span className="text-sm whitespace-nowrap">{row.original.phone}</span>
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
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];

function DemoRequestRowActions({ row }: Readonly<{ row: DemoRequest }>) {
  return (
    <Link
      to="/demo-requests/$demoRequestId"
      params={{ demoRequestId: row.id }}
      className={buttonVariants({ variant: "ghost", size: "icon" })}
    >
      <EyeIcon className="size-4" aria-hidden />
    </Link>
  );
}

export const demoRequestColumns = getCommonColumns<DemoRequest>({
  additionalColumns: dataColumns,
  columnsActions: DemoRequestRowActions,
});
