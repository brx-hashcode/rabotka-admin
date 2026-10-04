import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "#/components/ui/chart";
import { TIME_RANGE_QUERY_KEY, timeRangeParser } from "./chart-area-filter";
import { getJobActivity } from "#/lib/api/dashboard-controller";
import {
  JOB_STATUSES,
  JOB_STATUS_STACK_ORDER,
  JOB_STATUS_STYLE,
  jobStatusChartConfig,
  type JobStatus,
} from "../job-status-colors";

const chartConfig = jobStatusChartConfig satisfies ChartConfig;

const RANGE_LABELS: Record<string, string> = {
  "90d": "last 3 months",
  "30d": "last 30 days",
  "7d": "last 7 days",
};

const formatDay = (value: string, withYear = false) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });

type Row = { date: string; total: number } & Record<JobStatus, number>;

/** Every status with a non-zero count that day, in lifecycle order, plus the total. */
function DayTooltip({
  active,
  payload,
}: Readonly<{ active?: boolean; payload?: { payload: Row }[] }>) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const present = JOB_STATUSES.filter((s) => row[s] > 0);
  return (
    <div className="bg-background grid min-w-44 gap-1.5 rounded-lg px-2.5 py-1.5 text-xs shadow-xl">
      <p className="font-medium">{formatDay(row.date, true)}</p>
      {present.length === 0 ? (
        <p className="text-muted-foreground">No job posted</p>
      ) : (
        <>
          {present.map((s) => (
            <div key={s} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-[2px]"
                  style={{ background: `var(--color-${s})` }}
                />
                <span className="text-muted-foreground">
                  {JOB_STATUS_STYLE[s].label}
                </span>
              </span>
              <span className="font-mono font-medium tabular-nums">{row[s]}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <span className="text-muted-foreground">Posted that day</span>
            <span className="font-mono font-medium tabular-nums">{row.total}</span>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Jobs posted per day, each bar split by the status those jobs are in today.
 *
 * It used to be "posted vs filled": two stacked areas, so "filled" was drawn
 * on top of "posted" and the top line was their sum; a smoothing curve that
 * dipped below zero between days; and "filled" counted by `updated_at`, which
 * moves on any edit. The server keeps no status history, so the honest view of
 * every status is this one — and stacking is right here: the segments of a
 * bar add up to that day's postings.
 */
export function ChartAreaInteractive() {
  const [timeRange] = useQueryState(TIME_RANGE_QUERY_KEY, timeRangeParser);
  const range = timeRange ?? "90d";

  const { data = [] } = useQuery({
    queryKey: ["admin", "dashboard", "job-activity", "by-status", range],
    queryFn: () => getJobActivity({ range }),
  });

  const rows: Row[] = data.map((d) => ({
    date: d.date,
    total: d.jobCreated,
    ...d.byStatus,
  }));
  const posted = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <Card className="@container/card h-full">
      <CardHeader>
        <CardTitle>Jobs posted, by status</CardTitle>
        <CardDescription>
          {posted.toLocaleString("en-US")} jobs posted, {RANGE_LABELS[range]} —
          each bar is one day, split by the status those jobs are in today
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={rows} barCategoryGap="15%">
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => formatDay(value)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={28}
              allowDecimals={false}
              tickCount={4}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.08 }}
              content={<DayTooltip />}
            />
            {JOB_STATUS_STACK_ORDER.map((s) => (
              <Bar
                key={s}
                dataKey={s}
                stackId="status"
                fill={`var(--color-${s})`}
                // A thin surface-coloured edge keeps touching segments apart.
                stroke="var(--card)"
                strokeWidth={1}
              />
            ))}
            <ChartLegend
              content={<ChartLegendContent className="flex-wrap gap-y-1" />}
              payload={JOB_STATUSES.map((s) => ({
                value: s,
                dataKey: s,
                type: "square" as const,
                color: `var(--color-${s})`,
              }))}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
