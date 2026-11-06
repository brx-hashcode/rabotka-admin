import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "#/components/ui/chart";
import { Skeleton } from "#/components/ui/skeleton";
import {
  getOnboardingTimeline,
  type OnboardingEntry,
  type TimelineBucket,
} from "#/lib/api/onboarding-attempts-controller";

/**
 * Two parts of one whole: of the sign-ups that began that day, those that
 * finished and those that did not (yet). Validated on both surfaces: green
 * #16a34a and grey #71717a, ΔE 12.0 under deuteranopia, both ≥ 3:1. The grey
 * is grey on purpose — « not finished » is not an alarm, many still finish —
 * and the legend, the gap between segments and the tooltip name each part.
 */
const chartConfig = {
  completed: { label: "Finished", color: "#16a34a" },
  open: { label: "Not finished", color: "#71717a" },
} satisfies ChartConfig;

const tick = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

const fullDay = (date: string, bucket: TimelineBucket) => {
  const d = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: bucket === "day" ? "long" : undefined,
    day: "numeric",
    month: "long",
  });
  return bucket === "week" ? `Week of ${d}` : d;
};

/**
 * Sign-ups over the period, by the day (or week) they began: the bars rise
 * and fall with traffic, and the green share inside each is that day's
 * conversion — the two things a funnel's totals hide.
 */
export function DropoffTimeline({
  window,
  entry,
  bucket,
}: Readonly<{
  window: { startedFrom?: string; startedTo?: string };
  entry?: OnboardingEntry;
  bucket: TimelineBucket;
}>) {
  const { data, isError, refetch } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "timeline", window, entry, bucket],
    queryFn: () => getOnboardingTimeline({ ...window, entry, bucket }),
  });

  // A failed load says so: a skeleton that never resolves reads as « loading ».
  if (isError) {
    return (
      <Card className="items-center gap-2 p-8 text-center">
        <p className="text-sm font-medium">The trend could not be loaded.</p>
        <Button size="sm" variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </Card>
    );
  }
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  const points = data.map((p) => ({ ...p, open: p.started - p.completed }));
  const total = points.reduce((sum, p) => sum + p.started, 0);
  const busiest = points.reduce(
    (best, p) => (p.started > (best?.started ?? 0) ? p : best),
    null as (typeof points)[number] | null,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Sign-ups over time</CardTitle>
          <p className="text-muted-foreground text-xs">
            By {bucket === "day" ? "day" : "week"} started: how many began, and how many finished.
          </p>
        </div>
        {busiest && (
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">{busiest.started}</p>
            <p className="text-muted-foreground text-xs">
              peak, {bucket === "day" ? "on" : "week of"} {tick(busiest.date)}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            No sign-ups started in this period.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart
              accessibilityLayer
              data={points}
              margin={{ left: 0, right: 4, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(d: string) => tick(d)}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
                className="text-xs"
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const p = payload?.[0]?.payload as (typeof points)[number] | undefined;
                      if (!p) return null;
                      return `${fullDay(p.date, bucket)} · ${p.started} started`;
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {/* Finished at the base, the rest stacked on top, a 2px surface
                  gap between; only the top of the column is rounded. */}
              <Bar
                dataKey="completed"
                stackId="s"
                fill="var(--color-completed)"
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Bar
                dataKey="open"
                stackId="s"
                fill="var(--color-open)"
                stroke="var(--card)"
                strokeWidth={2}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
