import type { Table as TableInstance } from "@tanstack/react-table";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  applicationColumns,
  applicationStatusOptions,
  penaltyAppliedOptions,
  type Application,
} from "#/features/applications-admin";
import { useApplicationsList } from "#/hooks/use-applications-list";

const INITIAL_PAGE_SIZE = 10;

function ApplicationsTableHeader({
  table,
}: Readonly<{ table: TableInstance<Application> }>) {
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
        ]}
        table={table}
      />
    </TableHeader>
  );
}

function renderApplicationsHeader(table: TableInstance<Application>) {
  return <ApplicationsTableHeader table={table} />;
}

export default function ApplicationsPage() {
  const { data, total, isLoading } = useApplicationsList();

  return (
    <DataTable
      isPaginated
      enableRowSelection
      data={data}
      columns={applicationColumns}
      header={renderApplicationsHeader}
      totalCount={total}
      isLoading={isLoading}
      initialPageSize={INITIAL_PAGE_SIZE}
      getRowId={(row) => row.id}
    />
  );
}
