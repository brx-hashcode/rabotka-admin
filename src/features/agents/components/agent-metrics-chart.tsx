import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { IconChartBar, IconTable } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "#/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "#/components/ui/chart";
import { Skeleton } from "#/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { useAgentTimeseries } from "#/hooks/use-agents";
import type {
  AgentTimeseriesPoint,
  AgentTimeseriesRange,
} from "#/lib/api/agents-controller";
import { cn } from "#/lib/utils";
import { formatFcfa } from "../agent-rules";

type Metric = "created" | "activeAgents" | "earned" | "paidOut";

const METRICS: {
  key: Metric;
  label: string;
  description: string;
  money: boolean;
}[] = [
  {
    key: "activeAgents",
    label: "Active agents",
    description: "Agents who signed in to the agent app, per day",
    money: false,
  },
  {
    key: "created",
    label: "New agents",
    description: "Agents created, per day",
    money: false,
  },
  {
    key: "earned",
    label: "Commissions",
    description: "Commissions earned by agents, per day (FCFA)",
    money: true,
  },
  {
    key: "paidOut",
    label: "Paid out",
    description: "Paid out to agents, per day (FCFA)",
    money: true,
  },
];

const RANGES: { days: AgentTimeseriesRange; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "3 months" },
  { days: 180, label: "6 months" },
];

/**
 * One series, one axis, one hue. Counts and FCFA never share a plot — the
 * header switches which metric is drawn, it never overlays two.
 *
 * Violet in both themes, at a step validated per surface: the default dark
 * chart blue falls under 3:1 against the dark card.
 */
const chartConfig = {
  value: {
    label: "Value",
    theme: { light: "#9810fa", dark: "#ad46ff" },
  },
} satisfies ChartConfig;

function formatValue(metric: Metric, value: number): string {
  return METRICS.find((m) => m.key === metric)?.money
    ? formatFcfa(value)
    : value.toLocaleString("fr-FR");
}

/**
 * Agent metrics over time — the bar-chart companion to the stat cards.
 * Every day of the range is a bar, zeros included, so a quiet week reads as
 * quiet rather than as missing data.
 */
export function AgentMetricsChart() {
  const [days, setDays] = useState<AgentTimeseriesRange>(90);
  const [metric, setMetric] = useState<Metric>("activeAgents");
  const [asTable, setAsTable] = useState(false);
  const { data, isLoading } = useAgentTimeseries(days);

  // Money metrics exist only when the server sent them (not for MODERATOR).
  const metrics = METRICS.filter((m) => !m.money || data?.totals.earned !== undefined);
  const active = metrics.some((m) => m.key === metric) ? metric : "activeAgents";
  const current = METRICS.find((m) => m.key === active)!;

  const points = useMemo(
    () =>
      (data?.points ?? []).map((p: AgentTimeseriesPoint) => ({
        date: p.date,
        value: p[active] ?? 0,
      })),
    [data, active],
  );
  const total = data?.totals[active] ?? 0;
  const allZero = points.every((p) => p.value === 0);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-col gap-3 px-6 pt-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col justify-center gap-1">
          <CardTitle>{current.label}</CardTitle>
          <CardDescription>
            {current.description}, last {RANGES.find((r) => r.days === days)?.label}
          </CardDescription>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={active === m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                "flex min-w-28 flex-col justify-center gap-1 rounded-md px-4 py-3 text-left transition-colors",
                active === m.key
                  ? "bg-muted"
                  : "bg-muted/30 hover:bg-muted/60",
              )}
            >
              <span className="text-muted-foreground text-xs">{m.label}</span>
              <span className="text-lg leading-none font-bold tabular-nums sm:text-2xl">
                {isLoading ? "—" : formatValue(m.key, data?.totals[m.key] ?? 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-4">
        <ToggleGroup
          type="single"
          value={String(days)}
          onValueChange={(v) => v && setDays(Number(v) as AgentTimeseriesRange)}
          variant="outline"
          size="sm"
        >
          {RANGES.map((r) => (
            <ToggleGroupItem key={r.days} value={String(r.days)} className="px-3">
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAsTable((t) => !t)}
          aria-pressed={asTable}
        >
          {asTable ? (
            <IconChartBar className="size-4" />
          ) : (
            <IconTable className="size-4" />
          )}
          {asTable ? "Chart" : "Table"}
        </Button>
      </div>

      <CardContent className="px-2 pt-4 pb-4 sm:px-6">
        {isLoading && <Skeleton className="h-[260px] w-full" />}

        {!isLoading && asTable && (
          <MetricTable
            points={points}
            metric={active}
            total={total}
          />
        )}

        {!isLoading && !asTable && (
          <div className="relative">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={points}
                margin={{ left: 0, right: 8 }}
                barCategoryGap={2}
              >
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={current.money ? 64 : 32}
                  allowDecimals={false}
                  tickCount={4}
                  tickFormatter={(v: number) =>
                    current.money ? `${Math.round(v / 1000)}k` : String(v)
                  }
                />
                <ChartTooltip
                  cursor={{ fillOpacity: 0.08 }}
                  content={
                    <ChartTooltipContent
                      className="w-44"
                      nameKey="value"
                      labelFormatter={(d: string) =>
                        format(parseISO(d), "EEE d MMM yyyy")
                      }
                      formatter={(value) => (
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            {current.label}
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {formatValue(active, Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ChartContainer>
            {allZero && (
              <p className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
                No {current.label.toLowerCase()} in this period.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** The same series as rows: the non-visual view, newest day first. */
function MetricTable({
  points,
  metric,
  total,
}: Readonly<{
  points: { date: string; value: number }[];
  metric: Metric;
  total: number;
}>) {
  const rows = [...points].reverse().filter((p) => p.value !== 0);
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        Nothing recorded in this period.
      </p>
    );
  }
  return (
    <div className="max-h-[260px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground bg-card sticky top-0 text-xs">
          <tr>
            <th className="py-2 text-left font-medium">Day</th>
            <th className="py-2 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((p) => (
            <tr key={p.date}>
              <td className="py-2">{format(parseISO(p.date), "EEE d MMM yyyy")}</td>
              <td className="py-2 text-right tabular-nums">
                {formatValue(metric, p.value)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-medium">
            <td className="py-2">Total</td>
            <td className="py-2 text-right tabular-nums">
              {formatValue(metric, total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
