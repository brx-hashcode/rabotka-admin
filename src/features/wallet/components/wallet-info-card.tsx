import { useQuery } from "@tanstack/react-query";
import {
  IconWallet,
  IconCircleCheck,
  IconClock,
  IconChartBar,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
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
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "wallet", "info"],
    queryFn: getWalletInfo,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Revenue" icon={IconWallet} isLoading={isLoading}>
        <p className="text-2xl font-bold">
          {(data?.totalRevenue ?? 0).toLocaleString()} FCFA
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Sum of all completed payments
        </p>
      </StatCard>

      <StatCard
        title="Completed Payments"
        icon={IconCircleCheck}
        isLoading={isLoading}
      >
        <p className="text-2xl font-bold">{data?.completedCount ?? 0}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {data?.pendingCount ?? 0} pending · {data?.failedCount ?? 0} failed
        </p>
      </StatCard>

      <StatCard
        title="Job Posting Revenue"
        icon={IconChartBar}
        isLoading={isLoading}
      >
        <p className="text-2xl font-bold">
          {(data?.revenueByType.jobPosting ?? 0).toLocaleString()} FCFA
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          From job posting fees
        </p>
      </StatCard>

      <StatCard
        title="Penalty & Registration"
        icon={IconClock}
        isLoading={isLoading}
      >
        <p className="text-2xl font-bold">
          {(
            (data?.revenueByType.penalty ?? 0) +
            (data?.revenueByType.registration ?? 0)
          ).toLocaleString()}{" "}
          FCFA
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {(data?.revenueByType.penalty ?? 0).toLocaleString()} penalty ·{" "}
          {(data?.revenueByType.registration ?? 0).toLocaleString()} registration
        </p>
      </StatCard>
    </div>
  );
}
