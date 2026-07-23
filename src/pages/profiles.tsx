import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  profileColumns,
  statusOptions,
  profileTypeOptions,
  whatsappStatusOptions,
  verificationStatusOptions,
  ProfileExportMenu,
  type Profile,
} from "#/features/applications";
import { useProfilesList } from "#/hooks/use-profiles-list";

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
          {
            id: "profile_type",
            label: "Profile type",
            options: profileTypeOptions,
          },
          {
            id: "whatsapp_connected",
            label: "WhatsApp",
            options: whatsappStatusOptions,
          },
          {
            id: "verification_status",
            label: "Verification",
            options: verificationStatusOptions,
          },
        ]}
        table={table}
      >
        <ProfileExportMenu />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

function renderProfilesHeader(table: TableInstance<Profile>) {
  return <ProfilesTableHeader table={table} />;
}

export default function ProfilesPage() {
  const { data, total, isLoading } = useProfilesList();

  return (
    <div className="pt-6">
      <PageListHeader
        title="Profiles"
        description="Search and manage candidate profiles, verification and account status."
      />
      <DataTable
        isPaginated
        enableRowSelection
        data={data}
        columns={profileColumns}
        header={renderProfilesHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
