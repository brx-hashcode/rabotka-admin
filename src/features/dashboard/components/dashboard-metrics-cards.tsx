import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "#/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";

export type TrendDirection = "up" | "down";

export type DashboardMetricCard = {
  id: string;
  title: string;
  value: string;
  trend: TrendDirection;
  trendPercentage: number;
  description: string;
};

function formatTrendLabel(
  trend: TrendDirection,
  trendPercentage: number,
): string {
  if (trend === "up") {
    return `+${trendPercentage}%`;
  }
  return `-${Math.abs(trendPercentage)}%`;
}

const SKELETON_KEYS = [
  "skeleton-revenue",
  "skeleton-profiles",
  "skeleton-jobs",
  "skeleton-applications",
] as const;

function MetricCardSkeleton() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-8 w-32 animate-pulse rounded" />
        <CardAction>
          <div className="bg-muted h-6 w-14 animate-pulse rounded" />
        </CardAction>
      </CardHeader>
      <CardFooter className="text-sm">
        <div className="bg-muted h-4 w-full max-w-[180px] animate-pulse rounded" />
      </CardFooter>
    </Card>
  );
}

export type DashboardMetricsCardsProps = Readonly<{
  data: DashboardMetricCard[];
  isLoading?: boolean;
}>;

export function DashboardMetricsCards({
  data,
  isLoading = false,
}: DashboardMetricsCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {isLoading
        ? SKELETON_KEYS.map((key) => <MetricCardSkeleton key={key} />)
        : data.map((metric) => {
            const TrendIcon =
              metric.trend === "up" ? IconTrendingUp : IconTrendingDown;
            const trendLabel = formatTrendLabel(
              metric.trend,
              metric.trendPercentage,
            );

            return (
              <Card key={metric.id} className="@container/card">
                <CardHeader>
                  <CardDescription>{metric.title}</CardDescription>
                  <CardTitle className="text-4xl font-bold tabular-nums @[250px]/card:text-4xl">
                    {metric.value}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <TrendIcon />
                      {trendLabel}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="text-sm">
                  <p className="text-muted-foreground line-clamp-2">
                    {metric.description}
                  </p>
                </CardFooter>
              </Card>
            );
          })}
    </div>
  );
}
