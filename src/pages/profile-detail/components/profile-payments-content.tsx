import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  IconWallet,
  IconGavel,
  IconLock,
  IconPlus,
  IconGift,
  IconUserPlus,
  IconDeviceMobile,
  IconArrowBackUp,
  IconBriefcase,
  IconReceipt,
  IconArrowDownLeft,
  IconArrowUpRight,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import type { IconProps } from "@tabler/icons-react";
import {
  getProfileWallet,
  creditProfileWallet,
  type AdminProfileWalletTransaction,
} from "#/lib/api/profiles-controller";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { toast } from "sonner";

const TX_TYPE_LABELS: Record<string, string> = {
  WELCOME_CREDIT: "Welcome credit",
  MANUAL_CREDIT: "Manual credit (admin)",
  CONTACT_UNLOCK_DEBIT: "Contact unlock",
  CONTACT_UNLOCK_CREDIT: "Contact unlock refund",
  CONTACT_UNLOCK_CREDIT_CONVERSION: "Unlock expired — credit",
  MOBILE_MONEY_TOPUP: "Mobile money top-up",
  TOP_UP_CREDIT: "Top up credit",
  PENALTY_DEBIT: "Penalty deducted",
  JOB_POSTING_DEBIT: "Job posting fee",
  JOB_POSTING_PAYMENT: "Job posting payment",
  REGISTRATION_PAYMENT: "Registration fee",
  PENALTY_PAYMENT: "Penalty payment",
  CREDIT: "Credit",
  DEBIT: "Debit",
};

/**
 * One icon per movement, so a long list is scannable by shape.
 *
 * The list is overwhelmingly the same two or three types repeated — five
 * "Contact unlock" rows in a row is the normal case — and identical text at
 * identical weight is what made it read as noise rather than as a ledger.
 */
const TX_TYPE_ICONS: Record<string, ComponentType<IconProps>> = {
  WELCOME_CREDIT: IconGift,
  MANUAL_CREDIT: IconUserPlus,
  CONTACT_UNLOCK_DEBIT: IconLock,
  CONTACT_UNLOCK_CREDIT: IconArrowBackUp,
  CONTACT_UNLOCK_CREDIT_CONVERSION: IconArrowBackUp,
  MOBILE_MONEY_TOPUP: IconDeviceMobile,
  TOP_UP_CREDIT: IconDeviceMobile,
  PENALTY_DEBIT: IconGavel,
  PENALTY_PAYMENT: IconGavel,
  JOB_POSTING_DEBIT: IconBriefcase,
  JOB_POSTING_PAYMENT: IconBriefcase,
  REGISTRATION_PAYMENT: IconReceipt,
};

function txTypeIcon(type: string, credit: boolean): ComponentType<IconProps> {
  return TX_TYPE_ICONS[type] ?? (credit ? IconArrowDownLeft : IconArrowUpRight);
}

/** "Today" / "Yesterday" / a date — the heading each run of rows sits under. */
function dayHeading(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMMM yyyy");
}

/**
 * Groups movements by day and totals each one.
 *
 * The daily net is the number someone is actually looking for when a balance
 * moved and they want to know why — reading it off a column of individual
 * amounts is arithmetic the screen can do instead.
 */
function groupTransactionsByDay(
  transactions: AdminProfileWalletTransaction[],
): { key: string; heading: string; net: number; txs: AdminProfileWalletTransaction[] }[] {
  const groups = new Map<
    string,
    { key: string; heading: string; net: number; txs: AdminProfileWalletTransaction[] }
  >();

  for (const tx of [...transactions].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )) {
    const date = new Date(tx.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = format(date, "yyyy-MM-dd");
    const signed = isCredit(tx.type) ? tx.amount : -tx.amount;
    const existing = groups.get(key);
    if (existing) {
      existing.txs.push(tx);
      existing.net += signed;
    } else {
      groups.set(key, {
        key,
        heading: dayHeading(date),
        net: signed,
        txs: [tx],
      });
    }
  }
  return [...groups.values()];
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function txTypeLabel(type: string) {
  return TX_TYPE_LABELS[type] ?? type.replaceAll("_", " ");
}

function isCredit(type: string): boolean {
  return (
    type === "WELCOME_CREDIT" ||
    type === "MANUAL_CREDIT" ||
    type === "CONTACT_UNLOCK_CREDIT" ||
    type === "CONTACT_UNLOCK_CREDIT_CONVERSION" ||
    type === "MOBILE_MONEY_TOPUP" ||
    type === "TOP_UP_CREDIT" ||
    type === "CREDIT"
  );
}

function sumByType(transactions: AdminProfileWalletTransaction[], type: string) {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce((s, tx) => s + tx.amount, 0);
}

type StatCardProps = {
  icon: ComponentType<IconProps>;
  label: string;
  value: string;
  highlight?: boolean;
};

function StatCard({ icon: Icon, label, value, highlight }: Readonly<StatCardProps>) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-5 pb-5">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
            highlight
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="text-lg font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type CreditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number, note: string) => void;
  isPending: boolean;
};

function CreditWalletModal({ open, onOpenChange, onSubmit, isPending }: Readonly<CreditModalProps>) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) return;
    onSubmit(parsed, note.trim());
  }

  function handleOpenChange(v: boolean) {
    if (!v) { setAmount(""); setNote(""); }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Credit wallet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="credit-amount">Amount (FCFA)</Label>
            <Input
              id="credit-amount"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credit-note">
              Note <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="credit-note"
              type="text"
              placeholder="Reason for credit…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !amount}>
              {isPending ? "Crediting…" : "Credit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Props = {
  profileId: string;
};

export function ProfilePaymentsContent({ profileId }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [creditOpen, setCreditOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "wallet"],
    queryFn: () => getProfileWallet(profileId),
  });

  const creditMutation = useMutation({
    mutationFn: ({ amount, note }: { amount: number; note: string }) =>
      creditProfileWallet(profileId, amount, note || undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "profiles", profileId, "wallet"],
      });
      setCreditOpen(false);
      toast.success("Wallet credited successfully");
    },
    onError: () => {
      toast.error("Failed to credit wallet");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  const penaltySpend = sumByType(transactions, "PENALTY_DEBIT");
  const unlockSpend = sumByType(transactions, "CONTACT_UNLOCK_DEBIT");

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          icon={IconWallet}
          label="Wallet balance"
          value={formatAmount(balance)}
          highlight
        />
        <StatCard
          icon={IconGavel}
          label="Penalty spend"
          value={formatAmount(penaltySpend)}
        />
        <StatCard
          icon={IconLock}
          label="Contact unlock spend"
          value={formatAmount(unlockSpend)}
        />
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">
            Transaction history
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setCreditOpen(true)}
          >
            <IconPlus className="size-3.5" />
            Credit wallet
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconWallet className="text-muted-foreground mb-2 size-8" />
              <p className="text-muted-foreground text-sm">
                No transactions yet.
              </p>
            </div>
          ) : (
            <div>
              {groupTransactionsByDay(transactions).map((group) => (
                <section key={group.key}>
                  {/* Sticky, so the day stays answerable while scrolling a long
                      run of same-day movements. The net is what someone wants
                      when a balance moved and they are asking why. */}
                  <div className="bg-muted/40 text-muted-foreground sticky top-0 z-10 flex items-center justify-between px-6 py-1.5 text-xs font-medium">
                    <span>{group.heading}</span>
                    <span
                      className={`tabular-nums ${
                        group.net > 0
                          ? "text-emerald-500"
                          : group.net < 0
                            ? "text-rose-500"
                            : ""
                      }`}
                    >
                      {group.net > 0 ? "+" : group.net < 0 ? "−" : ""}
                      {formatAmount(Math.abs(group.net))}
                    </span>
                  </div>
                  <div className="divide-y">
                    {group.txs.map((tx) => (
                      <TransactionRow key={tx.id} tx={tx} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreditWalletModal
        open={creditOpen}
        onOpenChange={setCreditOpen}
        onSubmit={(amount, note) => creditMutation.mutate({ amount, note })}
        isPending={creditMutation.isPending}
      />
    </div>
  );
}

function TransactionRow({
  tx,
}: Readonly<{ tx: AdminProfileWalletTransaction }>) {
  const credit = isCredit(tx.type);
  const Icon = txTypeIcon(tx.type, credit);
  const date = new Date(tx.createdAt);
  const valid = !Number.isNaN(date.getTime());

  return (
    <div className="flex items-center gap-3 px-6 py-3">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
          credit ? "text-emerald-500" : "text-muted-foreground"
        }`}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{txTypeLabel(tx.type)}</p>
        <p className="text-muted-foreground text-xs">
          {valid ? format(date, "HH:mm") : tx.createdAt}
          {valid && (
            <span title={format(date, "PPpp")}>
              {" · "}
              {formatDistanceToNow(date, { addSuffix: true })}
            </span>
          )}
        </p>
      </div>

      {/* Plain, weighted text rather than a filled pill. Every row carried one,
          so the colour marked nothing — and a ledger is read down the amount
          column, which a badge's padding breaks up. The reference id moves to
          the title: it is for support to quote, not for anyone to read. */}
      <div
        className={`shrink-0 text-right font-mono text-sm tabular-nums ${
          credit ? "text-emerald-500" : "text-foreground"
        }`}
        title={
          tx.referenceType
            ? `${tx.referenceType}${tx.referenceId ? ` · ${tx.referenceId}` : ""}`
            : undefined
        }
      >
        {credit ? "+" : "−"}
        {formatAmount(tx.amount)}
      </div>
    </div>
  );
}
