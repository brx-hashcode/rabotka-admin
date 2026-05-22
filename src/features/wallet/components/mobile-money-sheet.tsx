
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { IconDeviceMobile, IconArrowsExchange } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { DataTable } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import {
  getMobileMoneyBalance,
  getMobileMoneyTransactions,
  type AdminMobileMoneyTransactionItem,
} from "#/lib/api/wallet-controller";

const LIMIT = 12;

const GATEWAY_LABELS: Record<string, string> = {
  MONETBIL: "Monetbil",
  MTN_MOMO: "MTN MoMo",
  UNKNOWN_GATEWAY: "Unknown",
};

const OPERATOR_LABELS: Record<string, string> = {
  CG_MTNMOBILEMONEY: "MTN Mobile Money",
  CG_AIRTELMONEY: "Airtel Money",
  UNKNOWN_OPERATOR: "Unknown",
};

function formatDate(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(v);
  }
}

const mmColumns: ColumnDef<AdminMobileMoneyTransactionItem, unknown>[] = [
  {
    id: "type",
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const isCredit = row.original.type === "MOBILE_MONEY_CREDIT";
      return (
        <Badge
          className={
            isCredit
              ? "bg-emerald-500 text-white border-transparent text-xs"
              : "bg-orange-500 text-white border-transparent text-xs"
          }
        >
          {isCredit ? "Credit" : "Withdrawal"}
        </Badge>
      );
    },
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original.amount.toLocaleString()} FCFA
      </span>
    ),
  },
  {
    id: "gateway",
    accessorKey: "gateway",
    header: "Gateway",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {GATEWAY_LABELS[row.original.gateway] ?? row.original.gateway}
      </Badge>
    ),
  },
  {
    id: "operator",
    accessorKey: "operator",
    header: "Operator",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {OPERATOR_LABELS[row.original.operator] ?? row.original.operator}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm text-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];

type Props = {
  children?: ReactNode;
};

export function MobileMoneySheet({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [gateway, setGateway] = useState("");
  const [page, setPage] = useState(1);

  // Reset page when gateway filter changes
  useEffect(() => {
    setPage(1);
  }, [gateway]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setGateway("");
      setPage(1);
    }
  }, [open]);

  const balanceQuery = useQuery({
    queryKey: ["admin", "wallet", "mobile-money", "balance"],
    queryFn: getMobileMoneyBalance,
    enabled: open,
  });

  const txQuery = useQuery({
    queryKey: [
      "admin",
      "wallet",
      "mobile-money",
      "transactions",
      { page, gateway },
    ],
    queryFn: () =>
      getMobileMoneyTransactions({
        page,
        limit: LIMIT,
        gateway: gateway || undefined,
      }),
    enabled: open,
  });

  const balance = balanceQuery.data?.balance ?? 0;
  const transactionCount = balanceQuery.data?.transactionCount ?? 0;
  const byOperator = balanceQuery.data?.byOperator ?? {};
  const byGateway = balanceQuery.data?.byGateway ?? {};
  const gatewayKeys = Object.keys(byGateway);

  const txData = txQuery.data?.data ?? [];
  const total = txQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children}
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-xl gap-0 p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <IconDeviceMobile className="size-5 text-[#4fb8b2]" />
            <SheetTitle>Mobile Money Wallet</SheetTitle>
          </div>
          <SheetDescription>
            Balance and transaction history for all mobile money inflows
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Balance cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Balance
                </CardTitle>
                <IconDeviceMobile className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {balanceQuery.isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {balance.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mobile money inflows
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transactions
                </CardTitle>
                <IconArrowsExchange className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {balanceQuery.isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{transactionCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total operations
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Operator breakdown */}
          {Object.keys(byOperator).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(byOperator).map(([op, amount]) => (
                <div
                  key={op}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                >
                  <span className="text-muted-foreground">
                    {OPERATOR_LABELS[op] ?? op}
                  </span>
                  <span className="font-semibold">
                    {amount.toLocaleString()} FCFA
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Gateway filter */}
          {gatewayKeys.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={gateway === "" ? "default" : "outline"}
                className="h-7 text-xs rounded-full"
                onClick={() => setGateway("")}
              >
                All gateways
              </Button>
              {gatewayKeys.map((gw) => (
                <Button
                  key={gw}
                  size="sm"
                  variant={gateway === gw ? "default" : "outline"}
                  className="h-7 text-xs rounded-full"
                  onClick={() => setGateway(gw)}
                >
                  {GATEWAY_LABELS[gw] ?? gw}
                  <span className="ml-1 text-[10px] opacity-70">
                    {byGateway[gw]?.toLocaleString()} FCFA
                  </span>
                </Button>
              ))}
            </div>
          )}

          {/* Transaction table */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Transaction history</p>
            <DataTable
              data={txData}
              columns={mmColumns}
              isLoading={txQuery.isLoading}
              isPaginated={false}
              getRowId={(row) => row.id}
            />

            {/* Pagination */}
            {total > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
                <span>
                  Page {page} of {totalPages} · {total} total
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
