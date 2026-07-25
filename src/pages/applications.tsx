import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
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
import { bulkDeleteApplications } from "#/lib/api/applications-controller";
import { useRole } from "#/hooks/use-role";

function ApplicationsTableHeader({
  table,
}: Readonly<{ table: TableInstance<Application> }>) {
  const { canManageContent } = useRole();
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
        <BulkDeleteButton
          table={table}
          deleteFn={bulkDeleteApplications}
          queryKey={["admin", "applications"]}
          entityLabel="application"
          disabled={!canManageContent || deletedView}
        />
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
