import {
  IconMinus,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";

import { Badge } from "#/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import type { PeriodCounts } from "#/lib/api/dashboard-controller";
import { cn } from "#/lib/utils";

export type DashboardMetricCard = {
  id: string;
  title: string;
  value: string;
  /**
   * How many arrived in the last 30 days and in the 30 days before. The value
   * above is an all-time total, so the card says what moved in words: a
   * percentage beside a total read as « the total fell 80 % », and on counts
   * this small (1 against 5) a percentage is mostly noise anyway.
   */
  period?: PeriodCounts | null;
  description: string;
};

const nf = (n: number) => n.toLocaleString();

const DIRECTION = {
  up: { Icon: IconTrendingUp, className: "text-emerald-600 dark:text-emerald-400" },
  down: { Icon: IconTrendingDown, className: "text-rose-600 dark:text-rose-400" },
  flat: { Icon: IconMinus, className: "text-muted-foreground" },
} as const;

function directionOf({ current, previous }: PeriodCounts) {
  if (current > previous) return DIRECTION.up;
  if (current < previous) return DIRECTION.down;
  return DIRECTION.flat;
}

function PeriodBadge({ period }: Readonly<{ period: PeriodCounts }>) {
  const { Icon, className } = directionOf(period);
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-normal tabular-nums", className)}
      title="New in the last 30 days, compared with the 30 days before"
    >
      <Icon />
      {period.current > 0 ? `+${nf(period.current)}` : "0"} · 30 days
    </Badge>
  );
}

function periodSentence({ current, previous }: PeriodCounts): string {
  return `${nf(current)} in the last 30 days, against ${nf(previous)} the 30 days before.`;
}

const SKELETON_KEYS = [
  "skeleton-assignments",
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
          <div className="bg-muted h-6 w-20 animate-pulse rounded" />
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="bg-muted h-4 w-full max-w-[220px] animate-pulse rounded" />
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
        : data.map((metric) => (
            <Card key={metric.id} className="@container/card">
              <CardHeader>
                <CardDescription>{metric.title}</CardDescription>
                <CardTitle className="text-4xl font-bold tabular-nums @[250px]/card:text-4xl">
                  {metric.value}
                </CardTitle>
                {metric.period ? (
                  <CardAction>
                    <PeriodBadge period={metric.period} />
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                {metric.period ? (
                  <p className="font-medium tabular-nums">
                    {periodSentence(metric.period)}
                  </p>
                ) : null}
                <p className="text-muted-foreground line-clamp-2">
                  {metric.description}
                </p>
              </CardFooter>
            </Card>
          ))}
    </div>
  );
}
