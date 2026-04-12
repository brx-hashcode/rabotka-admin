import { useQuery } from "@tanstack/react-query";
import {
  IconWallet,
  IconGavel,
  IconLock,
} from "@tabler/icons-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { Icon, IconProps } from "@tabler/icons-react";
import {
  getProfileWallet,
  type AdminProfileWalletTransaction,
} from "#/lib/api/profiles-controller";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";

const TX_TYPE_LABELS: Record<string, string> = {
  WELCOME_CREDIT: "Welcome credit",
  CONTACT_UNLOCK_DEBIT: "Contact unlock",
  CONTACT_UNLOCK_CREDIT: "Contact unlock refund",
  CONTACT_UNLOCK_CREDIT_CONVERSION: "Unlock expired — credit",
  MOBILE_MONEY_TOPUP: "Mobile money top-up",
  PENALTY_DEBIT: "Penalty deducted",
  JOB_POSTING_DEBIT: "Job posting fee",
  JOB_POSTING_PAYMENT: "Job posting payment",
  REGISTRATION_PAYMENT: "Registration fee",
  PENALTY_PAYMENT: "Penalty payment",
  CREDIT: "Credit",
  DEBIT: "Debit",
};

function formatDate(v: string) {
  try {
    return new Date(v).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return v;
  }
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
    type === "CONTACT_UNLOCK_CREDIT" ||
    type === "CONTACT_UNLOCK_CREDIT_CONVERSION" ||
    type === "MOBILE_MONEY_TOPUP" ||
    type === "CREDIT"
  );
}

function sumByType(transactions: AdminProfileWalletTransaction[], type: string) {
  return transactions
    .filter((tx) => tx.type === type)
    .reduce((s, tx) => s + tx.amount, 0);
}

type StatCardProps = {
  icon: ForwardRefExoticComponent<Omit<IconProps, "ref"> & RefAttributes<Icon>>;
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

type Props = {
  profileId: string;
};

export function ProfilePaymentsContent({ profileId }: Readonly<Props>) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "wallet"],
    queryFn: () => getProfileWallet(profileId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Transaction history
          </CardTitle>
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
            <div className="divide-y">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionRow({
  tx,
}: Readonly<{ tx: AdminProfileWalletTransaction }>) {
  const credit = isCredit(tx.type);

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{txTypeLabel(tx.type)}</p>
        <p className="text-muted-foreground text-xs">{formatDate(tx.createdAt)}</p>
        {tx.referenceType && (
          <p className="text-muted-foreground truncate text-xs">
            Ref: {tx.referenceType}
            {tx.referenceId ? ` · ${tx.referenceId.slice(0, 8)}…` : ""}
          </p>
        )}
      </div>
      <div className="ml-4 shrink-0 text-right">
        <Badge
          className={`font-mono text-xs ${credit ? "bg-emerald-500 text-white border-transparent" : "bg-rose-600 text-white border-transparent"}`}
        >
          {credit ? "+" : "−"}
          {formatAmount(tx.amount)}
        </Badge>
      </div>
    </div>
  );
}
