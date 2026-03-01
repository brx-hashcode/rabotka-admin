import {
  DataTable,
  TableHeader,
  TableHeaderToolbar,
} from "#/components/table";
import {
  mockProfiles,
  priorityOptions,
  profileColumns,
  ProfileAction,
  statusOptions,
} from "#/features/applications";

export default function ProfilesPage() {
  return (
    <DataTable
      data={[...mockProfiles]}
      columns={profileColumns}
      enableRowSelection
      isPaginated
      header={(table) => (
        <TableHeader>
          <TableHeaderToolbar
            searchParamKey="q"
            searchPlaceholder="Filter profiles..."
            filters={[
              { id: "status", label: "Status", options: statusOptions },
              { id: "priority", label: "Priority", options: priorityOptions },
            ]}
            table={table}
          >
            <ProfileAction />
          </TableHeaderToolbar>
        </TableHeader>
      )}
    />
  );
}
