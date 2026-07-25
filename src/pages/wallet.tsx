import type { Table as TableInstance } from "@tanstack/react-table";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { IconDeviceMobile } from "@tabler/icons-react";
import { Button } from "#/components/ui/button";
import { SheetTrigger } from "#/components/ui/sheet";
import { DataTable, TableHeader, TableHeaderToolbar } from "#/components/table";
import { BulkDeleteButton } from "#/components/table/bulk-delete-button";
import {
  deletedFilterOptions,
  useIsDeletedView,
} from "#/components/table/deleted-filter";
import { Tabs, TabsContent } from "#/components/ui/tabs";
import { DateRangePicker } from "#/components/ui/date-range-picker";
import { useRole } from "#/hooks/use-role";
import { bulkDeleteWalletTransactions } from "#/lib/api/wallet-controller";
import {
  WalletInfoCard,
  WalletTabsList,
  WalletExportMenu,
  DEFAULT_WALLET_TAB,
  walletTransactionColumns,
  walletPaymentColumns,
  WalletRevenueBarChart,
  WalletRevenueRadarChart,
  MobileMoneySheet,
  type WalletTab,
} from "#/features/wallet";
import type {
  AdminWalletTransactionItem,
  AdminPaymentItem,
} from "#/lib/api/wallet-controller";
import { useWalletTransactions } from "#/hooks/use-wallet-transactions";
import { useWalletPayments } from "#/hooks/use-wallet-payments";

const TX_TYPE_OPTIONS = [
  { value: "CREDIT_PENALTY", label: "Penalty" },
  { value: "CREDIT_REGISTRATION", label: "Registration" },
  { value: "CREDIT_JOB_POSTING", label: "Job Posting" },
  { value: "CREDIT_COMMISSION", label: "Commission" },
  { value: "CONTACT_UNLOCK_PAYMENT", label: "Contact Unlock" },
  { value: "WELCOME_CREDIT", label: "Welcome Credit" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "PENALTY", label: "Penalty" },
  { value: "CONTACT_UNLOCK", label: "Contact Unlock" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

function TransactionsTableHeader({
  table,
}: Readonly<{ table: TableInstance<AdminWalletTransactionItem> }>) {
  const { canManageTeam } = useRole();
  const deletedView = useIsDeletedView();
  const [createdFrom, setCreatedFrom] = useQueryState(
    "created_from",
    parseAsString.withDefault(""),
  );
  const [createdTo, setCreatedTo] = useQueryState(
    "created_to",
    parseAsString.withDefault(""),
  );

  return (
    <TableHeader>
      <TableHeaderToolbar
        searchPlaceholder="Search transactions..."
        filters={[
          {
            id: "tx_type",
            label: "Type",
            options: TX_TYPE_OPTIONS,
          },
          { id: "deleted", label: "Deleted", options: deletedFilterOptions },
        ]}
        table={table}
      >
        <BulkDeleteButton
          table={table}
          deleteFn={bulkDeleteWalletTransactions}
          queryKey={["admin", "wallet", "transactions"]}
          entityLabel="transaction"
          disabled={!canManageTeam || deletedView}
        />
        <DateRangePicker
          from={createdFrom}
          to={createdTo}
          onFromChange={setCreatedFrom}
          onToChange={setCreatedTo}
        />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

function PaymentsTableHeader({
  table,
}: Readonly<{ table: TableInstance<AdminPaymentItem> }>) {
  const [createdFrom, setCreatedFrom] = useQueryState(
    "created_from",
    parseAsString.withDefault(""),
  );
  const [createdTo, setCreatedTo] = useQueryState(
    "created_to",
    parseAsString.withDefault(""),
  );

  return (
    <TableHeader>
      <TableHeaderToolbar
        searchPlaceholder="Search payments..."
        filters={[
          {
            id: "pay_type",
            label: "Type",
            options: PAYMENT_TYPE_OPTIONS,
          },
          {
            id: "pay_status",
            label: "Status",
            options: PAYMENT_STATUS_OPTIONS,
          },
        ]}
        table={table}
      >
        <DateRangePicker
          from={createdFrom}
          to={createdTo}
          onFromChange={setCreatedFrom}
          onToChange={setCreatedTo}
        />
      </TableHeaderToolbar>
    </TableHeader>
  );
}

function renderTransactionsTableHeader(
  table: TableInstance<AdminWalletTransactionItem>,
) {
  return <TransactionsTableHeader table={table} />;
}

function renderPaymentsTableHeader(table: TableInstance<AdminPaymentItem>) {
  return <PaymentsTableHeader table={table} />;
}

function WalletTransactionsTable() {
  const { data, total, isLoading } = useWalletTransactions();
  return (
    <DataTable
      isPaginated
      enableRowSelection
      data={data}
      columns={walletTransactionColumns}
      header={renderTransactionsTableHeader}
      totalCount={total}
      isLoading={isLoading}
      getRowId={(row) => row.id}
    />
  );
}

function WalletPaymentsTable() {
  const { data, total, isLoading } = useWalletPayments();
  return (
    <DataTable
      isPaginated
      enableRowSelection
      data={data}
      columns={walletPaymentColumns}
      header={renderPaymentsTableHeader}
      totalCount={total}
      isLoading={isLoading}
      getRowId={(row) => row.id}
    />
  );
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useQueryState(
    "wallet-tab",
    parseAsStringEnum<WalletTab>(["transactions", "payments"]).withDefault(
      DEFAULT_WALLET_TAB,
    ),
  );

  return (
    <div className="flex flex-col gap-6 pt-6">
      <WalletInfoCard />
      <div className="grid grid-cols-12 items-stretch gap-4">
        <div className="col-span-12 min-h-0 lg:col-span-9">
          <WalletRevenueBarChart />
        </div>
        <div className="col-span-12 min-h-0 lg:col-span-3">
          <WalletRevenueRadarChart />
        </div>
      </div>
      <MobileMoneySheet>
        <Tabs
          value={activeTab ?? DEFAULT_WALLET_TAB}
          onValueChange={(v) => setActiveTab(v as WalletTab)}
          className="w-full flex-col justify-start gap-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <WalletTabsList />
            <div className="flex items-center gap-2">
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconDeviceMobile className="size-4 mr-1" />
                  Mobile Money
                </Button>
              </SheetTrigger>
              <WalletExportMenu
                activeTab={(activeTab ?? DEFAULT_WALLET_TAB) as WalletTab}
              />
            </div>
          </div>
          <TabsContent value="transactions">
            <WalletTransactionsTable />
          </TabsContent>
          <TabsContent value="payments">
            <WalletPaymentsTable />
          </TabsContent>
        </Tabs>
      </MobileMoneySheet>
    </div>
  );
}
