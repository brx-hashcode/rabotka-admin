import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
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
import { bulkDeleteProfiles } from "#/lib/api/profiles-controller";
import { useRole } from "#/hooks/use-role";

function ProfilesTableHeader({
  table,
}: Readonly<{ table: TableInstance<Profile> }>) {
  const { canManageContent } = useRole();
  const deletedView = useIsDeletedView();
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
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        table={table}
      >
        <BulkDeleteButton
          table={table}
          deleteFn={bulkDeleteProfiles}
          queryKey={["admin", "profiles"]}
          entityLabel="profile"
          disabled={!canManageContent || deletedView}
        />
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
