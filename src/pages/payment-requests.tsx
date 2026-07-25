import { PageListHeader } from "#/components/page-list-header";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  paymentRequestColumns,
  type PaymentRequest,
} from "#/features/payment-requests";
import { usePaymentRequestsList } from "#/hooks/use-payment-requests-list";
import type { Table as TableInstance } from "@tanstack/react-table";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import { bulkDeletePaymentRequests } from "#/lib/api/payment-requests-controller";
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
  const { canManageContent } = useRole();
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
        <BulkDeleteButton
          table={table}
          deleteFn={bulkDeletePaymentRequests}
          queryKey={["admin", "payment-requests"]}
          entityLabel="payment request"
          disabled={!canManageContent || deletedView}
        />
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
    <div className="pt-6">
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
