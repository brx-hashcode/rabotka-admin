import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  paymentRequestColumns,
  type PaymentRequest,
} from "#/features/payment-requests";
import { usePaymentRequestsList } from "#/hooks/use-payment-requests-list";
import type { Table as TableInstance } from "@tanstack/react-table";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import { BulkPurgeButton } from "#/components/table/bulk-purge-button";
import { BulkRestoreButton } from "#/components/table/bulk-restore-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import {
  bulkDeletePaymentRequests,
  bulkPurgePaymentRequests,
  bulkRestorePaymentRequests,
} from "#/lib/api/payment-requests-controller";
import { useRole } from "#/hooks/use-role";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function PaymentRequestsTableHeader({
  table,
}: Readonly<{ table: TableInstance<PaymentRequest> }>) {
  const { canPurge, canEditArea } = useRole();
  const canEdit = canEditArea("/payment-requests");
  const deletedView = useIsDeletedView();
  return (
    <TableHeader>
      <TableHeaderToolbar
        searchParamKey="status"
        searchPlaceholder="Filter by status..."
        filters={[
          {
            id: "status",
            label: "Status",
            options: STATUS_OPTIONS,
          },
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        table={table}
      >
        {deletedView ? (
          <>
            <BulkRestoreButton
              table={table}
              restoreFn={bulkRestorePaymentRequests}
              queryKey={["admin", "payment-requests"]}
              entityLabel="payment request"
              disabled={!canEdit}
            />
            <BulkPurgeButton
              table={table}
              purgeFn={bulkPurgePaymentRequests}
              queryKey={["admin", "payment-requests"]}
              entityLabel="payment request"
              disabled={!canPurge}
            />
          </>
        ) : (
          <BulkDeleteButton
            table={table}
            deleteFn={bulkDeletePaymentRequests}
            queryKey={["admin", "payment-requests"]}
            entityLabel="payment request"
            disabled={!canEdit}
          />
        )}
      </TableHeaderToolbar>
    </TableHeader>
  );
}

function renderHeader(table: TableInstance<PaymentRequest>) {
  return <PaymentRequestsTableHeader table={table} />;
}

export default function PaymentRequestsPage() {
  const { data, total, isLoading } = usePaymentRequestsList();

  return (
    <div>
      <PageListHeader
        title="Payment Requests"
        description="Review proof submissions and approve or reject payout requests."
      />
      <DataTable
        isPaginated
        enableRowSelection
        data={data}
        columns={paymentRequestColumns}
        header={renderHeader}
        totalCount={total}
        isLoading={isLoading}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
