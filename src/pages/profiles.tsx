import type { Table as TableInstance } from "@tanstack/react-table";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  mockProfiles,
  priorityOptions,
  profileColumns,
  ProfileAction,
  statusOptions,
  type Profile,
} from "#/features/applications";
import { whatsappStatusOptions } from "#/features/applications/components/profile-table";

function ProfilesTableHeader({
  table,
}: Readonly<{ table: TableInstance<Profile> }>) {
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter profiles..."
        filters={[
          { id: "status", label: "Status", options: statusOptions },
          { id: "priority", label: "Priority", options: priorityOptions },
          {
            id: "whatsapp_connected",
            label: "Whatsapp Status",
            options: whatsappStatusOptions,
          },
        ]}
        table={table}
      >
        <ProfileAction />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

function renderProfilesHeader(table: TableInstance<Profile>) {
  return <ProfilesTableHeader table={table} />;
}

export default function ProfilesPage() {
  return (
    <DataTable
      isPaginated
      enableRowSelection
      data={[...mockProfiles]}
      columns={profileColumns}
      header={renderProfilesHeader}
    />
  );
}
