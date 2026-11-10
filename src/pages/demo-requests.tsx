import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  demoRequestColumns,
  demoStatusOptions,
  type DemoRequest,
} from "#/features/demo-requests";
import { useDemoRequestsList } from "#/hooks/use-demo-requests-list";

function DemoRequestsTableHeader({
  table,
}: Readonly<{ table: TableInstance<DemoRequest> }>) {
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter by company, name, e-mail or phone..."
        filters={[{ id: "status", label: "Status", options: demoStatusOptions }]}
        table={table}
      />
    </TableHeader>
  );
}

function renderDemoRequestsHeader(table: TableInstance<DemoRequest>) {
  return <DemoRequestsTableHeader table={table} />;
}

export default function DemoRequestsPage() {
  const { data, total, isLoading } = useDemoRequestsList();

  return (
    <div>
      <PageListHeader
        title="Demo requests"
        description="Companies that asked for a Rabotka Business demo on business.rabotka.work. The site promises a call back within one working day: call the new ones first, then log the follow-up."
      />
      <DataTable
        isPaginated
        data={data}
        columns={demoRequestColumns}
        header={renderDemoRequestsHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
