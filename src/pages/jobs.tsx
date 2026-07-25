import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import {
  jobColumns,
  jobStatusOptions,
  JobExportMenu,
  type JobOffer,
} from "#/features/jobs";
import { useJobsList } from "#/hooks/use-jobs-list";
import { bulkDeleteJobOffers } from "#/lib/api/jobs-controller";
import { useRole } from "#/hooks/use-role";

function JobsTableHeader({
  table,
}: Readonly<{ table: TableInstance<JobOffer> }>) {
  const { canManageContent } = useRole();
  const deletedView = useIsDeletedView();
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter jobs..."
        filters={[
          { id: "status", label: "Status", options: jobStatusOptions },
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        table={table}
      >
        <BulkDeleteButton
          table={table}
          deleteFn={bulkDeleteJobOffers}
          queryKey={["admin", "jobs"]}
          entityLabel="job offer"
          disabled={!canManageContent || deletedView}
        />
        <JobExportMenu />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

function renderJobsHeader(table: TableInstance<JobOffer>) {
  return <JobsTableHeader table={table} />;
}

export default function JobsPage() {
  const { data, total, isLoading } = useJobsList();

  return (
    <div className="pt-6">
      <PageListHeader
        title="Missions"
        description="Browse and filter published job offers and their status."
      />
      <DataTable
        isPaginated
        enableRowSelection
        data={data}
        columns={jobColumns}
        header={renderJobsHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
