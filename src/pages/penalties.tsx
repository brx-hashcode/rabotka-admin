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
import { BulkPurgeButton } from "#/components/table/bulk-purge-button";
import { BulkRestoreButton } from "#/components/table/bulk-restore-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import {
  bulkDeletePenalties,
  bulkPurgePenalties,
  bulkRestorePenalties,
} from "#/lib/api/penalties-controller";
import { useRole } from "#/hooks/use-role";

function PenaltiesTableHeader({
  table,
}: Readonly<{ table: TableInstance<Penalty> }>) {
  const { canPurge, canEditArea } = useRole();
  const canEdit = canEditArea("/penalties");
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
        {deletedView ? (
          <>
            <BulkRestoreButton
              table={table}
              restoreFn={bulkRestorePenalties}
              queryKey={["admin", "penalties"]}
              entityLabel="penalty"
              disabled={!canEdit}
            />
            <BulkPurgeButton
              table={table}
              purgeFn={bulkPurgePenalties}
              queryKey={["admin", "penalties"]}
              entityLabel="penalty"
              disabled={!canPurge}
            />
          </>
        ) : (
          <BulkDeleteButton
            table={table}
            deleteFn={bulkDeletePenalties}
            queryKey={["admin", "penalties"]}
            entityLabel="penalty"
            disabled={!canEdit}
          />
        )}
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
    <div>
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
