import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import {
  paymentRequestColumns,
  type PaymentRequest,
} from "#/features/payment-requests";
import { usePaymentRequestsList } from "#/hooks/use-payment-requests-list";
import type { Table as TableInstance } from "@tanstack/react-table";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function PaymentRequestsTableHeader({
  table,
}: Readonly<{ table: TableInstance<PaymentRequest> }>) {
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
        ]}
        table={table}
      />
    </TableHeader>
  );
}

function renderHeader(table: TableInstance<PaymentRequest>) {
  return <PaymentRequestsTableHeader table={table} />;
}

export default function PaymentRequestsPage() {
  const { data, total, isLoading } = usePaymentRequestsList();

  return (
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
  );
}
