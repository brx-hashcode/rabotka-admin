import type { Table as TableInstance } from "@tanstack/react-table";
import { useQueryState } from "nuqs";

import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { AmountRangePicker } from "#/components/ui/amount-range-picker";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import { BulkPurgeButton } from "#/components/table/bulk-purge-button";
import { BulkRestoreButton } from "#/components/table/bulk-restore-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import {
  jobColumns,
  jobStatusOptions,
  employmentTypeOptions,
  paymentFlowOptions,
  JobExportMenu,
  type JobOffer,
} from "#/features/jobs";
import { jobsParsers, useJobsList } from "#/hooks/use-jobs-list";
import {
  bulkDeleteJobOffers,
  bulkPurgeJobOffers,
  bulkRestoreJobOffers,
} from "#/lib/api/jobs-controller";
import { useRole } from "#/hooks/use-role";

function JobsTableHeader({
  table,
}: Readonly<{ table: TableInstance<JobOffer> }>) {
  const { canManageContent, canPurge } = useRole();
  const deletedView = useIsDeletedView();

  // Kept on the same parsers the list hook reads, so the control and the query
  // cannot disagree about what the URL means.
  const [amountMin, setAmountMin] = useQueryState(
    "amount_min",
    jobsParsers.amount_min,
  );
  const [amountMax, setAmountMax] = useQueryState(
    "amount_max",
    jobsParsers.amount_max,
  );

  const handleResetExtras = () => {
    void setAmountMin(null);
    void setAmountMax(null);
  };

  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter jobs..."
        filters={[
          { id: "status", label: "Status", options: jobStatusOptions },
          {
            id: "employment_type",
            label: "Type",
            options: employmentTypeOptions,
          },
          {
            id: "payment_flow",
            label: "Payment",
            options: paymentFlowOptions,
          },
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        extraFilters={
          <AmountRangePicker
            min={amountMin}
            max={amountMax}
            onMinChange={setAmountMin}
            onMaxChange={setAmountMax}
          />
        }
        extraFiltersActive={amountMin != null || amountMax != null}
        onResetExtras={handleResetExtras}
        table={table}
      >
        {deletedView ? (
          <>
            <BulkRestoreButton
              table={table}
              restoreFn={bulkRestoreJobOffers}
              queryKey={["admin", "jobs"]}
              entityLabel="job offer"
              disabled={!canManageContent}
            />
            <BulkPurgeButton
              table={table}
              purgeFn={bulkPurgeJobOffers}
              queryKey={["admin", "jobs"]}
              entityLabel="job offer"
              disabled={!canPurge}
            />
          </>
        ) : (
          <BulkDeleteButton
            table={table}
            deleteFn={bulkDeleteJobOffers}
            queryKey={["admin", "jobs"]}
            entityLabel="job offer"
            disabled={!canManageContent}
          />
        )}
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
