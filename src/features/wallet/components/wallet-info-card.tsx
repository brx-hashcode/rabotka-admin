import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  IconWallet,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useWalletStatsRange } from "#/hooks/use-wallet-stats-range";
import { getWalletInfo } from "#/lib/api/wallet-controller";

function StatCard({
  title,
  icon: Icon,
  isLoading,
  children,
}: Readonly<{
  title: string;
  icon: React.ElementType;
  isLoading: boolean;
  children: React.ReactNode;
}>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-32" /> : children}
      </CardContent>
    </Card>
  );
}

export function WalletInfoCard() {
  const range = useWalletStatsRange();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "wallet", "info", range],
    queryFn: () => getWalletInfo(range),
    placeholderData: keepPreviousData,
  });
  const topUps = data?.walletTopUps?.amount ?? 0;
  const unlockSplit = data?.contactUnlockByMethod;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Revenue" icon={IconWallet} isLoading={isLoading}>
        <p className="text-2xl font-bold">
          {(data?.totalRevenue ?? 0).toLocaleString()} FCFA
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {topUps > 0
            ? `Excludes ${topUps.toLocaleString()} FCFA wallet top-ups (deposits)`
            : "Sum of earned payments"}
        </p>
      </StatCard>

      <StatCard
        title="Completed Payments"
        icon={IconCircleCheck}
        isLoading={isLoading}
      >
        <p className="text-2xl font-bold">
          {data?.completedPaymentsCount ?? data?.completedCount ?? 0}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data?.pendingCount ?? 0} pending · {data?.failedCount ?? 0} failed
        </p>
      </StatCard>

      <StatCard
        title="Penalty Revenue"
        icon={IconClock}
        isLoading={isLoading}
      >
        <p className="text-2xl font-bold">
          {(data?.revenueByType.penalty ?? 0).toLocaleString()} FCFA
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          From late cancellation penalties
        </p>
      </StatCard>

      <StatCard
        title="Contact Unlock Revenue"
        icon={IconWallet}
        isLoading={isLoading}
      >
        <p className="text-2xl font-bold">
          {(data?.revenueByType.contactUnlock ?? 0).toLocaleString()} FCFA
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {unlockSplit
            ? `${unlockSplit.mobileMoney.toLocaleString()} mobile money · ${unlockSplit.wallet.toLocaleString()} from wallet`
            : "Via wallet credit & mobile money"}
        </p>
      </StatCard>
    </div>
  );
}
