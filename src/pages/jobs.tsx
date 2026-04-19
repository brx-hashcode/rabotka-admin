import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  jobColumns,
  jobStatusOptions,
  type JobOffer,
} from "#/features/jobs";
import { useJobsList } from "#/hooks/use-jobs-list";

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
