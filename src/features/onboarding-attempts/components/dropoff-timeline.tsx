import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "#/components/ui/card";
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
 * is grey on purpose — « pas terminée » is not an alarm, many still finish —
 * and the legend, the gap between segments and the tooltip name each part.
 */
const chartConfig = {
  completed: { label: "Terminées", color: "#16a34a" },
  open: { label: "Pas terminées", color: "#71717a" },
} satisfies ChartConfig;

const tick = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("fr", {
    day: "numeric",
    month: "short",
  });

const fullDay = (date: string, bucket: TimelineBucket) => {
  const d = new Date(`${date}T12:00:00Z`).toLocaleDateString("fr", {
    weekday: bucket === "day" ? "long" : undefined,
    day: "numeric",
    month: "long",
  });
  return bucket === "week" ? `Semaine du ${d}` : d.charAt(0).toUpperCase() + d.slice(1);
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
  const { data } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "timeline", window, entry, bucket],
    queryFn: () => getOnboardingTimeline({ ...window, entry, bucket }),
  });

  if (!data) return <Skeleton className="h-72 rounded-2xl" />;

  const points = data.map((p) => ({ ...p, open: p.started - p.completed }));
  const total = points.reduce((sum, p) => sum + p.started, 0);
  const busiest = points.reduce(
    (best, p) => (p.started > (best?.started ?? 0) ? p : best),
    null as (typeof points)[number] | null,
  );

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Évolution des inscriptions</h2>
          <p className="text-muted-foreground text-sm">
            {bucket === "day" ? "Par jour" : "Par semaine"} de début : combien ont commencé, et combien ont terminé.
          </p>
        </div>
        {busiest && (
          <span className="text-muted-foreground text-sm">
            Pic{" "}
            <span className="text-foreground font-semibold tabular-nums">
              {busiest.started}
            </span>{" "}
            {bucket === "day" ? "le" : "la semaine du"} {tick(busiest.date)}
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Aucune inscription commencée sur cette période.
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
                    return `${fullDay(p.date, bucket)} · ${p.started} commencée${p.started > 1 ? "s" : ""}`;
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
    </Card>
  );
}
