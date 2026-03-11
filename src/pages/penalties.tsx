import type { Table as TableInstance } from "@tanstack/react-table";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  penaltyColumns,
  penaltyPaymentStatusOptions,
  type Penalty,
} from "#/features/penalties";
import { usePenaltiesList } from "#/hooks/use-penalties-list";

const INITIAL_PAGE_SIZE = 10;

function PenaltiesTableHeader({
  table,
}: Readonly<{ table: TableInstance<Penalty> }>) {
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="q"
        searchPlaceholder="Filter penalties..."
        filters={[
          {
            id: "payment_status",
            label: "Payment status",
            options: penaltyPaymentStatusOptions,
          },
        ]}
        table={table}
      />
    </TableHeader>
  );
}

function renderPenaltiesHeader(table: TableInstance<Penalty>) {
  return <PenaltiesTableHeader table={table} />;
}

export default function PenaltiesPage() {
  const { data, total, isLoading } = usePenaltiesList();

  return (
    <DataTable
      isPaginated
      enableRowSelection
      data={data}
      columns={penaltyColumns}
      header={renderPenaltiesHeader}
      totalCount={total}
      isLoading={isLoading}
      initialPageSize={INITIAL_PAGE_SIZE}
      getRowId={(row) => row.id}
    />
  );
}
