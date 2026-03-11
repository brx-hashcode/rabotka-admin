import type { Table as TableInstance } from "@tanstack/react-table";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  jobColumns,
  jobStatusOptions,
  paymentFlowOptions,
  type JobOffer,
} from "#/features/jobs";
import { useJobsList } from "#/hooks/use-jobs-list";

const INITIAL_PAGE_SIZE = 10;

function JobsTableHeader({
  table,
}: Readonly<{ table: TableInstance<JobOffer> }>) {
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter jobs..."
        filters={[
          { id: "status", label: "Status", options: jobStatusOptions },
          {
            id: "payment_flow",
            label: "Payment flow",
            options: paymentFlowOptions,
          },
        ]}
        table={table}
      />
    </TableHeader>
  );
}

function renderJobsHeader(table: TableInstance<JobOffer>) {
  return <JobsTableHeader table={table} />;
}

export default function JobsPage() {
  const { data, total, isLoading } = useJobsList();

  return (
    <DataTable
      isPaginated
      enableRowSelection
      data={data}
      columns={jobColumns}
      header={renderJobsHeader}
      totalCount={total}
      isLoading={isLoading}
      initialPageSize={INITIAL_PAGE_SIZE}
      getRowId={(row) => row.id}
    />
  );
}
