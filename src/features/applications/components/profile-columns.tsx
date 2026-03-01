import type { ColumnDef } from "@tanstack/react-table";

import { getCommonColumns } from "#/components/table";

export type ProfileStatus =
  | "Backlog"
  | "Todo"
  | "In Progress"
  | "Done"
  | "Canceled";

export type ProfilePriority = "Low" | "Medium" | "High";

export type Profile = Readonly<{
  id: string;
  title: string;
  status: ProfileStatus;
  priority: ProfilePriority;
}>;

const profileDataColumns: ColumnDef<Profile, unknown>[] = [
  {
    id: "task",
    accessorKey: "id",
    header: "Task",
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground text-xs">
        {row.original.id}
      </span>
    ),
  },
  {
    id: "title",
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.status}</span>
    ),
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.priority}</span>
    ),
  },
];

export const profileColumns = getCommonColumns<Profile>({
  additionalColumns: profileDataColumns,
});
