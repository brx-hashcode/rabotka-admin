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
  applicationColumns,
  applicationStatusOptions,
  penaltyAppliedOptions,
  ApplicationExportMenu,
  type Application,
} from "#/features/applications-admin";
import { useApplicationsList } from "#/hooks/use-applications-list";
import {
  bulkDeleteApplications,
  bulkPurgeApplications,
  bulkRestoreApplications,
} from "#/lib/api/applications-controller";
import { useRole } from "#/hooks/use-role";

function ApplicationsTableHeader({
  table,
}: Readonly<{ table: TableInstance<Application> }>) {
  const { canManageContent, canPurge } = useRole();
  const deletedView = useIsDeletedView();
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter applications..."
        filters={[
          {
            id: "status",
            label: "Status",
            options: applicationStatusOptions,
          },
          {
            id: "penalty_applied",
            label: "Penalty",
            options: penaltyAppliedOptions,
          },
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        table={table}
      >
        {deletedView ? (
          <>
            <BulkRestoreButton
              table={table}
              restoreFn={bulkRestoreApplications}
              queryKey={["admin", "applications"]}
              entityLabel="application"
              disabled={!canManageContent}
            />
            <BulkPurgeButton
              table={table}
              purgeFn={bulkPurgeApplications}
              queryKey={["admin", "applications"]}
              entityLabel="application"
              disabled={!canPurge}
            />
          </>
        ) : (
          <BulkDeleteButton
            table={table}
            deleteFn={bulkDeleteApplications}
            queryKey={["admin", "applications"]}
            entityLabel="application"
            disabled={!canManageContent}
          />
        )}
        <ApplicationExportMenu />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

function renderApplicationsHeader(table: TableInstance<Application>) {
  return <ApplicationsTableHeader table={table} />;
}

export default function ApplicationsPage() {
  const { data, total, isLoading } = useApplicationsList();

  return (
    <div className="pt-6">
      <PageListHeader
        title="Applications"
        description="Track job applications, penalties and application status."
      />
      <DataTable
        isPaginated
        enableRowSelection
        data={data}
        columns={applicationColumns}
        header={renderApplicationsHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
