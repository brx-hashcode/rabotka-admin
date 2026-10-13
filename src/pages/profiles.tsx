import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import { BulkPurgeButton } from "#/components/table/bulk-purge-button";
import { BulkRestoreButton } from "#/components/table/bulk-restore-button";
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
import {
  bulkDeleteProfiles,
  bulkPurgeProfiles,
  bulkRestoreProfiles,
} from "#/lib/api/profiles-controller";
import { useRole } from "#/hooks/use-role";

function ProfilesTableHeader({
  table,
}: Readonly<{ table: TableInstance<Profile> }>) {
  const { canManageContent, canPurge } = useRole();
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
        {deletedView ? (
          <>
            <BulkRestoreButton
              table={table}
              restoreFn={bulkRestoreProfiles}
              queryKey={["admin", "profiles"]}
              entityLabel="profile"
              disabled={!canManageContent}
            />
            <BulkPurgeButton
              table={table}
              purgeFn={bulkPurgeProfiles}
              queryKey={["admin", "profiles"]}
              entityLabel="profile"
              note="Their KYC documents, photos and uploaded files are deleted from storage too. Profiles that made or attempted a payment are kept."
              disabled={!canPurge}
            />
          </>
        ) : (
          <BulkDeleteButton
            table={table}
            deleteFn={bulkDeleteProfiles}
            queryKey={["admin", "profiles"]}
            entityLabel="profile"
            disabled={!canManageContent}
          />
        )}
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
    <div>
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
