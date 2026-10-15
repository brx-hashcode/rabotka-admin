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
  IconArrowBarToDown,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCopy,
  IconDeviceMobile,
  IconFileInvoice,
  IconRefresh,
  IconSearch,
  IconSend,
  IconWallet,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { DataTable } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";
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
  downloadAdminInvoice,
  getGatewayBalances,
  getMobileMoneyBalance,
  getMobileMoneyTransactions,
  getPaymentGateways,
  listPayouts,
  recordMobileMoneyWithdrawal,
  refreshPayout,
  type AdminPayoutItem,
  type AdminMobileMoneyTransactionItem,
  type MobileNetworkKey,
  type PaymentGatewayMetadata,
} from "#/lib/api/wallet-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn } from "#/lib/utils";
import { useRole } from "#/hooks/use-role";
import { SendPayoutDialog } from "./send-payout-dialog";

const LIMIT = 15;

/** The gateway balance shown, for now. ISO 3166-1 alpha-3. */
const BALANCE_COUNTRY = "COG";

/**
 * Written by the backend when a transaction carries no gateway, so it is ours
 * to name rather than the registry's.
 */
const UNKNOWN_GATEWAY_LABEL: Record<string, string> = {
  UNKNOWN: "Unknown",
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

const NETWORK_LABELS: Record<MobileNetworkKey, string> = {
  MTN: "MTN Mobile Money",
  AIRTEL: "Airtel Money",
  ORANGE: "Orange Money",
  OTHER: "Other",
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  CONTACT_UNLOCK: "Contact unlock",
  RECOMMENDATION_CONTACT: "Recommended contact",
  WALLET_TOP_UP: "Wallet top-up",
  PENALTY_BATCH: "Penalty",
  PENALTY_RESOLUTION: "Penalty",
};

const PROFILE_TYPE_LABELS: Record<string, string> = {
  WORKER: "Worker",
  EMPLOYER: "Employer",
};

const fcfa = (n: number) => `${Math.round(n).toLocaleString()} FCFA`;

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

/** A reference shortened for the table, copied whole on click. */
function CopyRef({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(value)}
          className="group flex items-center gap-1 text-left text-xs text-muted-foreground hover:text-foreground"
        >
          <span className="shrink-0">{label}</span>
          <span className="font-mono">{value.slice(0, 8)}</span>
          <IconCopy className="size-3 opacity-0 group-hover:opacity-100" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{value} — click to copy</TooltipContent>
    </Tooltip>
  );
}

const buildMmColumns = (
  labelFor: (key: string | null | undefined) => string,
): ColumnDef<AdminMobileMoneyTransactionItem, unknown>[] => [
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
  {
    id: "amount",
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const isCredit = row.original.type === "MOBILE_MONEY_CREDIT";
      return (
        <div className="flex items-center gap-1.5 text-nowrap">
          {isCredit ? (
            <IconArrowDownLeft className="size-4 text-emerald-500" />
          ) : (
            <IconArrowUpRight className="size-4 text-orange-500" />
          )}
          <span
            className={cn(
              "text-sm font-semibold",
              isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400",
            )}
          >
            {isCredit ? "+" : "−"}
            {fcfa(row.original.amount)}
          </span>
        </div>
      );
    },
  },
  {
    id: "payer",
    header: "Payer",
    cell: ({ row }) => {
      const t = row.original;
      if (t.type !== "MOBILE_MONEY_CREDIT") {
        return <span className="text-sm text-muted-foreground">Withdrawal</span>;
      }
      return (
        <div className="flex min-w-[140px] flex-col gap-0.5">
          <span className="text-sm font-medium">{t.payerName ?? "—"}</span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {t.payerProfileType && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {PROFILE_TYPE_LABELS[t.payerProfileType] ?? t.payerProfileType}
              </Badge>
            )}
            {t.payerPhone && <span className="font-mono">{t.payerPhone}</span>}
          </div>
        </div>
      );
    },
  },
  {
    id: "purpose",
    header: "Purpose",
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="flex max-w-[220px] flex-col gap-0.5">
          <span className="text-sm whitespace-normal wrap-break-word">
            {t.description ?? "—"}
          </span>
          {t.requestType && (
            <span className="text-xs text-muted-foreground">
              {REQUEST_TYPE_LABELS[t.requestType] ?? t.requestType}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "method",
    header: "Method",
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="flex flex-col gap-0.5 text-nowrap">
          <span className="text-sm">
            {t.network ? NETWORK_LABELS[t.network] : labelFor(t.operator)}
          </span>
          <span className="text-xs text-muted-foreground">
            {labelFor(t.gateway)}
          </span>
        </div>
      );
    },
  },
  {
    id: "references",
    header: "References",
    cell: ({ row }) => {
      const t = row.original;
      const refs = [
        t.paymentRequestId && { label: "Payment", value: t.paymentRequestId },
        t.gatewayRef && { label: "Gateway", value: t.gatewayRef },
        t.gatewayTxId && { label: "Operator", value: t.gatewayTxId },
      ].filter(Boolean) as { label: string; value: string }[];
      if (refs.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-col gap-0.5">
          {refs.map((r) => (
            <CopyRef key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      );
    },
  },
  {
    id: "invoice",
    header: "",
    cell: ({ row }) => {
      const id = row.original.invoiceId;
      if (!id) return null;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() =>
                void downloadAdminInvoice(id, `facture_${id.slice(0, 8)}.pdf`)
              }
            >
              <IconFileInvoice className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download the invoice</TooltipContent>
        </Tooltip>
      );
    },
  },
];

/** One headline figure. */
function Stat({
  title,
  icon,
  value,
  hint,
  loading,
  tone,
}: Readonly<{
  title: string;
  icon: ReactNode;
  value: string;
  hint: string;
  loading: boolean;
  tone?: "in" | "out";
}>) {
  return (
    <Card className="h-full gap-1 py-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-4">
        {loading ? (
          <Skeleton className="h-6 w-28" />
        ) : (
          <p
            className={cn(
              "text-lg font-bold leading-tight",
              tone === "in" && "text-emerald-600 dark:text-emerald-400",
              tone === "out" && "text-orange-600 dark:text-orange-400",
            )}
          >
            {value}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

/**
 * The live balance on the gateway account (pawaPay), per country. Not the
 * same figure as the ledger above: it is what the gateway actually holds,
 * after its own fees and any payout made outside Rabotka.
 */
function GatewayBalanceCard({
  open,
  gatewayLabel,
}: Readonly<{ open: boolean; gatewayLabel: string }>) {
  // Congo only for now; the backend already lists every country on the
  // account (balance-countries) for when the picker comes back.
  const balancesQuery = useQuery({
    queryKey: ["admin", "wallet", "gateway", "balances", BALANCE_COUNTRY],
    queryFn: () => getGatewayBalances(BALANCE_COUNTRY),
    enabled: open,
    retry: false,
  });

  const balances = balancesQuery.data?.balances ?? [];
  const loading = balancesQuery.isLoading;
  // 409: the active gateway reports no balance (e.g. MTN MoMo).
  const unsupported = /409|n'expose pas de solde/i.test(
    String((balancesQuery.error as Error | null)?.message ?? ""),
  );

  return (
    // shrink-0: in the sheet's scrolling column an overflow-hidden item is
    // allowed to shrink to nothing, which hid the balance under the header.
    <div className="relative flex h-full shrink-0 flex-col overflow-hidden rounded-xl bg-[#0d0f0d] px-4 py-3 text-white shadow-lg">
      {/* The glow: emerald into lime into amber, drifting in the corner. */}
      <div
        aria-hidden
        className="balance-card-glow pointer-events-none absolute -right-24 -top-28 size-64 rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 45% 65%, #f59e0b 0%, #d9f99d 28%, #34d399 52%, transparent 72%)",
        }}
      />
      {/* The sheen, passing over every few seconds. */}
      <div
        aria-hidden
        className="balance-card-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
      />

      <div className="relative flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-white/90">
          {gatewayLabel} balance <span className="text-white/50">· Live · Congo</span>
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-white/70 hover:bg-white/10 hover:text-white"
          onClick={() => void balancesQuery.refetch()}
          disabled={balancesQuery.isFetching}
          aria-label="Refresh"
        >
          <IconRefresh
            className={cn("size-4", balancesQuery.isFetching && "animate-spin")}
          />
        </Button>
      </div>

      <div className="relative mt-auto pt-1">
        {loading ? (
          <>
            <div className="h-6 w-32 animate-pulse rounded bg-white/15" />
          </>
        ) : balancesQuery.isError ? (
          <p className={cn("text-sm", unsupported ? "text-white/60" : "text-red-300")}>
            {unsupported
              ? "The active gateway doesn't report a balance."
              : friendlyError(
                  balancesQuery.error,
                  "The gateway didn't answer. Try again.",
                )}
          </p>
        ) : balances.length === 0 ? (
          <p className="text-sm text-white/60">No wallet in Congo.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {balances.map((b) => (
              <div key={`${b.currency}-${b.operator ?? ""}`}>
                <p
                  className="font-mono text-lg font-semibold leading-tight tracking-tight tabular-nums"
                  style={{ textShadow: "0 0 16px rgba(255,255,255,0.28)" }}
                >
                  <span className="mr-1.5 text-white/70">{b.currency}</span>
                  {Number(b.balance).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  children?: ReactNode;
};

type TypeFilter = "" | "MOBILE_MONEY_CREDIT" | "MOBILE_MONEY_WITHDRAWAL";

export function MobileMoneySheet({ children }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [gateway, setGateway] = useState("");
  const [network, setNetwork] = useState<MobileNetworkKey | "">("");
  const [type, setType] = useState<TypeFilter>("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [view, setView] = useState<"history" | "payouts">("history");
  const [payoutOpen, setPayoutOpen] = useState(false);
  const { canSendPayouts } = useRole();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawDescription, setWithdrawDescription] = useState("");
  const [withdrawGateway, setWithdrawGateway] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Any filter change starts from the first page.
  useEffect(() => {
    setPage(1);
  }, [gateway, network, type, q]);

  useEffect(() => {
    if (!open) {
      setGateway("");
      setNetwork("");
      setType("");
      setSearch("");
      setQ("");
      setPage(1);
    }
  }, [open]);

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
      { page, gateway, network, type, q },
    ],
    queryFn: () =>
      getMobileMoneyTransactions({
        page,
        limit: LIMIT,
        gateway: gateway || undefined,
        network: network || undefined,
        type: type || undefined,
        q: q || undefined,
      }),
    enabled: open,
    placeholderData: (previous) => previous,
  });

  const summary = balanceQuery.data;
  const balance = summary?.balance ?? 0;
  const gatewayTotals = summary?.gateways ?? [];
  const networkTotals = summary?.networks ?? [];

  const labelFor = useMemo(
    () => buildLabelLookup(gatewaysQuery.data?.gateways),
    [gatewaysQuery.data],
  );
  const mmColumns = useMemo(() => buildMmColumns(labelFor), [labelFor]);
  const activeGatewayLabel = labelFor(gatewaysQuery.data?.active ?? null);

  const txData = txQuery.data?.data ?? [];
  const total = txQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const filtered = !!(gateway || network || type || q);

  function openWithdrawDialog() {
    setWithdrawAmount("");
    setWithdrawDescription("");
    setWithdrawGateway(gatewayTotals[0]?.key ?? "");
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
      setWithdrawError(`Amount exceeds current balance (${fcfa(balance)}).`);
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
        friendlyError(err, "The withdrawal didn't go through. Try again."),
      );
    } finally {
      setWithdrawLoading(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        {children}
        <SheetContent
          side="right"
          className="flex flex-col w-full sm:max-w-7xl gap-0 p-0 overflow-hidden"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center gap-2">
              <IconDeviceMobile className="size-5 text-[#4fb8b2]" />
              <SheetTitle>Mobile Money</SheetTitle>
            </div>
            <SheetDescription>
              What came in and went out through mobile money, and what the
              gateway holds right now.
            </SheetDescription>
          </SheetHeader>

          {/* Fixed top, scrolling table: only the rows scroll, the figures and
              filters stay in view. */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
            <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                title="Ledger balance"
                icon={<IconWallet className="size-4 text-muted-foreground" />}
                value={fcfa(balance)}
                hint={`${summary?.transactionCount ?? 0} operations recorded`}
                loading={balanceQuery.isLoading}
              />
              <Stat
                title="Money in"
                icon={<IconArrowDownLeft className="size-4 text-emerald-500" />}
                value={fcfa(summary?.credits.amount ?? 0)}
                hint={`${summary?.credits.count ?? 0} payments`}
                loading={balanceQuery.isLoading}
                tone="in"
              />
              <Stat
                title="Money out"
                icon={<IconArrowUpRight className="size-4 text-orange-500" />}
                value={fcfa(summary?.withdrawals.amount ?? 0)}
                hint={`${summary?.withdrawals.count ?? 0} withdrawals`}
                loading={balanceQuery.isLoading}
                tone="out"
              />
              <GatewayBalanceCard open={open} gatewayLabel={activeGatewayLabel} />
            </div>

            {(networkTotals.length > 0 || gatewayTotals.length > 0) && (
              <div className="flex shrink-0 flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Money in by network and gateway — click to filter
                </p>
                <div className="flex flex-wrap gap-2">
                  {networkTotals.map((n) => (
                    <FilterChip
                      key={n.key}
                      active={network === n.key}
                      onClick={() => setNetwork(network === n.key ? "" : n.key)}
                      label={n.label}
                      amount={n.amount}
                      count={n.count}
                    />
                  ))}
                  <span className="mx-1 w-px self-stretch bg-border" />
                  {gatewayTotals.map((g) => (
                    <FilterChip
                      key={g.key}
                      active={gateway === g.key}
                      onClick={() => setGateway(gateway === g.key ? "" : g.key)}
                      label={labelFor(g.key)}
                      amount={g.amount}
                      count={g.count}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                size="sm"
                variant="outline"
                value={view}
                onValueChange={(v) => v && setView(v as "history" | "payouts")}
              >
                <ToggleGroupItem value="history" className="px-3 text-xs">
                  History
                </ToggleGroupItem>
                <ToggleGroupItem value="payouts" className="px-3 text-xs">
                  Payouts
                </ToggleGroupItem>
              </ToggleGroup>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs"
                  onClick={openWithdrawDialog}
                  disabled={balanceQuery.isLoading}
                >
                  <IconArrowBarToDown className="size-3.5" />
                  Record manual withdrawal
                </Button>
                {canSendPayouts && (
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 text-xs"
                    onClick={() => setPayoutOpen(true)}
                    disabled={balanceQuery.isLoading}
                  >
                    <IconSend className="size-3.5" />
                    Send payout
                  </Button>
                )}
              </div>
            </div>

            {view === "history" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search payer name or phone…"
                    className="h-9 pl-8"
                  />
                </div>
                <ToggleGroup
                  type="single"
                  size="sm"
                  variant="outline"
                  value={type || "ALL"}
                  onValueChange={(v) =>
                    setType(v === "ALL" || !v ? "" : (v as TypeFilter))
                  }
                >
                  <ToggleGroupItem value="ALL" className="px-3 text-xs">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="MOBILE_MONEY_CREDIT" className="px-3 text-xs">
                    Money in
                  </ToggleGroupItem>
                  <ToggleGroupItem value="MOBILE_MONEY_WITHDRAWAL" className="px-3 text-xs">
                    Money out
                  </ToggleGroupItem>
                </ToggleGroup>
                {filtered && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 text-xs"
                    onClick={() => {
                      setGateway("");
                      setNetwork("");
                      setType("");
                      setSearch("");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              <div className="min-h-60 flex-1">
                <DataTable
                  data={txData}
                  columns={mmColumns}
                  isLoading={txQuery.isLoading}
                  isPaginated={false}
                  getRowId={(row) => row.id}
                  fillHeight
                />
              </div>

              <div className="flex shrink-0 items-center justify-between pt-1 text-sm text-muted-foreground">
                <span>
                  {total > 0
                    ? `Page ${page} of ${totalPages} · ${total} ${filtered ? "matching" : "total"}`
                    : txQuery.isLoading
                      ? ""
                      : filtered
                        ? "No transaction matches these filters."
                        : "No transaction yet."}
                </span>
                {total > LIMIT && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1 || txQuery.isFetching}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages || txQuery.isFetching}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
            ) : (
              <PayoutsList open={open} labelFor={labelFor} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SendPayoutDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        ledgerBalance={balance}
      />

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record a manual withdrawal</DialogTitle>
            <DialogDescription>
              For money already moved outside {activeGatewayLabel}: only the
              ledger is debited, nothing is sent. Current balance:{" "}
              <span className="font-semibold text-foreground">
                {fcfa(balance)}
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
              <Label htmlFor="wd-gateway">Payment method *</Label>
              <Select
                value={withdrawGateway}
                onValueChange={(v) => {
                  setWithdrawGateway(v);
                  setWithdrawError(null);
                }}
                disabled={withdrawLoading}
              >
                <SelectTrigger id="wd-gateway" className="w-full">
                  <SelectValue placeholder="Choose a payment method" />
                </SelectTrigger>
                <SelectContent>
                  {gatewayTotals.map((g) => (
                    <SelectItem key={g.key} value={g.key}>
                      {labelFor(g.key)} — {fcfa(g.amount)}
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

const PAYOUT_STATUS: Record<
  AdminPayoutItem["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "bg-muted text-foreground" },
  COMPLETED: { label: "Completed", className: "bg-emerald-500 text-white" },
  FAILED: { label: "Failed", className: "bg-destructive text-white" },
};

/** Payouts sent from the gateway account, followed until they settle. */
function PayoutsList({
  open,
  labelFor,
}: Readonly<{
  open: boolean;
  labelFor: (key: string | null | undefined) => string;
}>) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "wallet", "payouts", page],
    queryFn: () => listPayouts({ page, limit: LIMIT }),
    enabled: open,
    placeholderData: (previous) => previous,
    // While one is pending, keep asking: the server re-checks it with the
    // gateway on each read.
    refetchInterval: (q) =>
      q.state.data?.data.some((p) => p.status === "PENDING") ? 5000 : false,
  });
  const [refreshing, setRefreshing] = useState<string | null>(null);

  async function refresh(id: string) {
    setRefreshing(id);
    try {
      await refreshPayout(id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "wallet"] });
    } finally {
      setRefreshing(null);
    }
  }

  const rows = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const columns: ColumnDef<AdminPayoutItem, unknown>[] = [
    {
      id: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-nowrap">
          {fcfa(row.original.amount)}
        </span>
      ),
    },
    {
      id: "recipient",
      header: "Recipient",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 text-nowrap">
          <span className="font-mono text-sm">{row.original.phone}</span>
          <span className="text-xs text-muted-foreground">
            {labelFor(row.original.operator)} · {labelFor(row.original.gateway)}
          </span>
        </div>
      ),
    },
    {
      id: "note",
      header: "Note",
      cell: ({ row }) => (
        <span className="block max-w-[200px] text-sm whitespace-normal wrap-break-word text-muted-foreground">
          {row.original.note ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const p = row.original;
        const s = PAYOUT_STATUS[p.status];
        return (
          <div className="flex flex-col gap-1">
            <Badge className={cn("w-fit border-transparent text-xs", s.className)}>
              {s.label}
            </Badge>
            {p.status === "FAILED" && p.failureReason && (
              <span className="max-w-[180px] text-xs text-destructive whitespace-normal">
                {p.failureReason}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "requestedBy",
      header: "Sent by",
      cell: ({ row }) => (
        <span className="text-sm text-nowrap">{row.original.requestedBy ?? "—"}</span>
      ),
    },
    {
      id: "references",
      header: "References",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            {p.gatewayRef && <CopyRef label="Gateway" value={p.gatewayRef} />}
            {p.gatewayTxId && <CopyRef label="Operator" value={p.gatewayTxId} />}
            {!p.gatewayRef && !p.gatewayTxId && (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.status === "PENDING" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => void refresh(row.original.id)}
                disabled={refreshing === row.original.id}
              >
                <IconRefresh
                  className={cn(
                    "size-4",
                    refreshing === row.original.id && "animate-spin",
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Check the status with the gateway</TooltipContent>
          </Tooltip>
        ) : null,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="min-h-60 flex-1">
        <DataTable
          data={rows}
          columns={columns}
          isLoading={query.isLoading}
          isPaginated={false}
          getRowId={(row) => row.id}
          fillHeight
        />
      </div>
      <div className="flex shrink-0 items-center justify-between pt-1 text-sm text-muted-foreground">
        <span>
          {total > 0
            ? `Page ${page} of ${totalPages} · ${total} payouts`
            : query.isLoading
              ? ""
              : "No payout yet."}
        </span>
        {total > LIMIT && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1 || query.isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || query.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** A total that doubles as a filter. Borderless: active is a filled pill. */
function FilterChip({
  active,
  onClick,
  label,
  amount,
  count,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  label: string;
  amount: number;
  count: number;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/70",
      )}
    >
      <span className={active ? "" : "text-muted-foreground"}>{label}</span>
      <span className="font-semibold">{fcfa(amount)}</span>
      <span className="opacity-70">· {count}</span>
    </button>
  );
}
