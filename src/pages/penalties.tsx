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
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import { bulkDeletePenalties } from "#/lib/api/penalties-controller";
import { useRole } from "#/hooks/use-role";

function PenaltiesTableHeader({
  table,
}: Readonly<{ table: TableInstance<Penalty> }>) {
  const { canManageContent } = useRole();
  const deletedView = useIsDeletedView();
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
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        table={table}
      >
        <BulkDeleteButton
          table={table}
          deleteFn={bulkDeletePenalties}
          queryKey={["admin", "penalties"]}
          entityLabel="penalty"
          disabled={!canManageContent || deletedView}
        />
      </TableHeaderToolbar>
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
