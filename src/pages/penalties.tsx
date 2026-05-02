import { useState } from "react";
import type { Table as TableInstance } from "@tanstack/react-table";
import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  penaltyColumns,
  penaltyPaymentStatusOptions,
  type Penalty,
} from "#/features/penalties";
import { CreatePenaltyDialog } from "#/features/penalties/components/create-penalty-dialog";
import { usePenaltiesList } from "#/hooks/use-penalties-list";
import { Button } from "#/components/ui/button";

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
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="pt-6">
      <PageListHeader
        title="Penalties"
        description="Violations, penalties and payment follow-up across profiles."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            + Create penalty
          </Button>
        }
      />
      <CreatePenaltyDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DataTable
        isPaginated
        enableRowSelection
        data={data}
        columns={penaltyColumns}
        header={renderPenaltiesHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
