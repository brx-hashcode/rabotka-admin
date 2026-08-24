import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDeviceMobile,
  IconArrowsExchange,
  IconArrowBarToDown,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { DataTable } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  getMobileMoneyBalance,
  getMobileMoneyTransactions,
  getPaymentGateways,
  recordMobileMoneyWithdrawal,
  type AdminMobileMoneyTransactionItem,
  type PaymentGatewayMetadata,
} from "#/lib/api/wallet-controller";

const LIMIT = 12;

/**
 * Written by the backend when a transaction carries no gateway, so it is ours
 * to name rather than the registry's.
 */
const UNKNOWN_GATEWAY_LABEL: Record<string, string> = {
  UNKNOWN_GATEWAY: "Unknown",
  UNKNOWN_OPERATOR: "Unknown",
};

/**
 * Names for gateways and operators come from the backend registry, so a new
 * provider is labelled here without this file being touched. An unrecognised
 * key still renders — historical rows can name a gateway the current build no
 * longer ships, and showing the raw key beats showing nothing.
 */
export function buildLabelLookup(
  gateways: PaymentGatewayMetadata[] | undefined,
): (key: string | null | undefined) => string {
  const labels: Record<string, string> = { ...UNKNOWN_GATEWAY_LABEL };
  for (const gateway of gateways ?? []) {
    labels[gateway.key] = gateway.label;
    for (const operator of gateway.operators) {
      labels[operator.code] = operator.label;
    }
  }
  return (key) => (key ? (labels[key] ?? key) : "—");
}

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

const buildMmColumns = (
  labelFor: (key: string | null | undefined) => string,
): ColumnDef<AdminMobileMoneyTransactionItem, unknown>[] => [
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
      <span className="text-sm text-muted-foreground">
        {labelFor(row.original.gateway)}
      </span>
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-normal wrap-break-word max-w-[180px] block">
        {row.original.description ?? "—"}
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

export function MobileMoneySheet({ children }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [gateway, setGateway] = useState("");
  const [page, setPage] = useState(1);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDescription, setWithdrawDescription] = useState("");
  const [withdrawGateway, setWithdrawGateway] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [gateway]);

  useEffect(() => {
    if (!open) {
      setGateway("");
      setPage(1);
    }
  }, [open]);

  function openWithdrawDialog() {
    setWithdrawAmount("");
    setWithdrawDescription("");
    setWithdrawGateway(gatewayKeys[0] ?? "");
    setWithdrawError(null);
    setWithdrawOpen(true);
    setTimeout(() => amountInputRef.current?.focus(), 50);
  }

  async function handleWithdraw() {
    const amount = Number(withdrawAmount);
    if (!withdrawAmount || Number.isNaN(amount) || amount <= 0) {
      setWithdrawError("Please enter a valid positive amount.");
      return;
    }
    if (amount > balance) {
      setWithdrawError(
        `Amount exceeds current balance (${balance.toLocaleString()} FCFA).`,
      );
      return;
    }
    setWithdrawLoading(true);
    setWithdrawError(null);
    try {
      await recordMobileMoneyWithdrawal({
        amount,
        description: withdrawDescription || undefined,
        reference: withdrawGateway || undefined,
      });
      setWithdrawOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "wallet", "mobile-money"],
      });
    } catch (err) {
      setWithdrawError(
        err instanceof Error ? err.message : "Withdrawal failed.",
      );
    } finally {
      setWithdrawLoading(false);
    }
  }

  const balanceQuery = useQuery({
    queryKey: ["admin", "wallet", "mobile-money", "balance"],
    queryFn: getMobileMoneyBalance,
    enabled: open,
  });

  // The registry only changes on a backend deploy, so it does not need
  // refetching alongside the balance and transaction queries.
  const gatewaysQuery = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: getPaymentGateways,
    enabled: open,
    staleTime: Infinity,
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

  const labelFor = useMemo(
    () => buildLabelLookup(gatewaysQuery.data?.gateways),
    [gatewaysQuery.data],
  );
  const mmColumns = useMemo(() => buildMmColumns(labelFor), [labelFor]);

  // Driven by what actually has transactions rather than by the registry: a
  // gateway this deployment never used is noise in the filter bar, and one it
  // has since moved off still needs to be filterable.
  const gatewayKeys = Object.keys(byGateway);

  const txData = txQuery.data?.data ?? [];
  const total = txQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        {children}
        <SheetContent
          side="right"
          className="flex flex-col w-full sm:max-w-4xl gap-0 p-0 overflow-hidden"
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

          <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 flex flex-col gap-6">
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

            {Object.keys(byOperator).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(byOperator).map(([op, amount]) => (
                  <div
                    key={op}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
                  >
                    <span className="text-muted-foreground">
                      {labelFor(op)}
                    </span>
                    <span className="font-semibold">
                      {amount.toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>
            )}

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
                    {labelFor(gw)}
                    <span className="ml-1 text-[10px] opacity-70">
                      {byGateway[gw]?.toLocaleString()} FCFA
                    </span>
                  </Button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Transaction history</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-8"
                  onClick={openWithdrawDialog}
                  disabled={balanceQuery.isLoading}
                >
                  <IconArrowBarToDown className="size-3.5" />
                  Withdraw
                </Button>
              </div>
              <DataTable
                data={txData}
                columns={mmColumns}
                isLoading={txQuery.isLoading}
                isPaginated={false}
                getRowId={(row) => row.id}
              />

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

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Withdrawal</DialogTitle>
            <DialogDescription>
              Debit the Mobile Money wallet. Current balance:{" "}
              <span className="font-semibold text-foreground">
                {balance.toLocaleString()} FCFA
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wd-amount">Amount (FCFA) *</Label>
              <Input
                id="wd-amount"
                ref={amountInputRef}
                type="number"
                min={1}
                placeholder="e.g. 50000"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setWithdrawError(null);
                }}
                disabled={withdrawLoading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wd-gateway">Gateway *</Label>
              <Select
                value={withdrawGateway}
                onValueChange={(v) => {
                  setWithdrawGateway(v);
                  setWithdrawError(null);
                }}
                disabled={withdrawLoading}
              >
                <SelectTrigger id="wd-gateway" className="w-full">
                  <SelectValue placeholder="Select a gateway" />
                </SelectTrigger>
                <SelectContent>
                  {gatewayKeys.map((gw) => (
                    <SelectItem key={gw} value={gw}>
                      {labelFor(gw)} —{" "}
                      {byGateway[gw]?.toLocaleString()} FCFA
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wd-desc">Note</Label>
              <Input
                id="wd-desc"
                placeholder="e.g. Withdrawal for salary"
                value={withdrawDescription}
                onChange={(e) => setWithdrawDescription(e.target.value)}
                disabled={withdrawLoading}
              />
            </div>

            {withdrawError && (
              <p className="text-sm text-destructive">{withdrawError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawOpen(false)}
              disabled={withdrawLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawLoading || !withdrawAmount}
            >
              {withdrawLoading ? "Processing…" : "Confirm withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
