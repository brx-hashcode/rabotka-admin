import { useQuery } from "@tanstack/react-query";
import { IconWallet, IconTrendingUp } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { getWalletInfo } from "#/lib/api/wallet-controller";

export function WalletInfoCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "wallet", "info"],
    queryFn: getWalletInfo,
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Balance
          </CardTitle>
          <IconWallet className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold">
              {(data?.balance ?? 0).toLocaleString()} FCFA
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            System wallet balance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Revenue
          </CardTitle>
          <IconTrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold">
              {(data?.totalRevenue ?? 0).toLocaleString()} FCFA
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Cumulative income from all transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
