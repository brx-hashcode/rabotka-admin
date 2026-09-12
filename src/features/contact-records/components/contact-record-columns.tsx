import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import type {
  AdminContactRecordListItem,
  ContactRecordOrigin,
} from "#/lib/api/contact-records-controller";
import { ContactRecordRowActions } from "./contact-record-row-actions";

export type ContactRecord = AdminContactRecordListItem;

export const contactOriginOptions = [
  { label: "Mission", value: "MISSION" },
  { label: "Direct", value: "DIRECT" },
];

export function getOriginLabel(origin: ContactRecordOrigin): string {
  return origin === "MISSION" ? "Mission" : "Direct";
}

export function getOriginBadgeClass(origin: ContactRecordOrigin): string {
  // Two routes, two meanings: MISSION came through a job the employer posted,
  // DIRECT is someone who went looking and paid to reach a worker cold. Worth
  // telling apart at a glance — they are the difference between a marketplace
  // that works and a directory people pay to browse.
  return origin === "MISSION"
    ? "bg-blue-500 text-white border-transparent"
    : "bg-violet-600 text-white border-transparent";
}

/** Email is optional now, so the profile cell falls back to the phone. */
function contactLine(email: string | null, phone: string): string {
  return email ?? phone;
}

function formatDateTime(value: string | null): string {
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

const contactRecordDataColumns: ColumnDef<ContactRecord, unknown>[] = [
  {
    id: "employer",
    accessorKey: "employerName",
    header: "Employer",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.employerName}
        email={contactLine(
          row.original.employerEmail,
          row.original.employerPhone,
        )}
        avatarUrl={row.original.employerAvatarUrl}
      />
    ),
  },
  {
    id: "worker",
    accessorKey: "workerName",
    header: "Worker",
    cell: ({ row }) => (
      <ProfileCell
        name={row.original.workerName}
        email={contactLine(row.original.workerEmail, row.original.workerPhone)}
        avatarUrl={row.original.workerAvatarUrl}
      />
    ),
  },
  {
    id: "origin",
    accessorKey: "origin",
    header: "Route",
    cell: ({ row }) => {
      const origin = row.original.origin;
      return (
        <Badge className={getOriginBadgeClass(origin)}>
          {getOriginLabel(origin)}
        </Badge>
      );
    },
  },
  {
    id: "jobTitle",
    accessorKey: "jobTitle",
    header: "Job",
    cell: ({ row }) => {
      // Null is the normal case for a DIRECT contact rather than missing data,
      // so it reads as "no job" instead of an empty cell.
      const title = row.original.jobTitle;
      if (!title) {
        return <span className="text-muted-foreground text-sm">No job</span>;
      }
      return (
        <div className="max-w-[200px]">
          <span className="font-medium text-sm wrap-break-word whitespace-normal">
            {title}
          </span>
        </div>
      );
    },
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: "Paid",
    cell: ({ row }) => (
      <span className="font-medium text-sm whitespace-nowrap">
        {row.original.amount.toLocaleString()} FCFA
      </span>
    ),
  },
  {
    id: "unlockedAt",
    accessorKey: "unlockedAt",
    header: "Contacted at",
    cell: ({ row }) => formatDateTime(row.original.unlockedAt),
  },
];

export const contactRecordColumns = getCommonColumns<ContactRecord>({
  additionalColumns: contactRecordDataColumns,
  columnsActions: ({ row }) => <ContactRecordRowActions record={row} />,
});
