import { Cell, Pie, PieChart } from "recharts";
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
  ChartTooltipContent,
  type ChartConfig,
} from "#/components/ui/chart";
import { TIME_RANGE_QUERY_KEY, timeRangeParser } from "./chart-area-filter";
import { getJobStatusDistribution } from "#/lib/api/dashboard-controller";
import { jobStatusChartConfig } from "../job-status-colors";

const DESCRIPTION_LABELS: Record<string, string> = {
  "90d": "Last 3 months",
  "30d": "Last 30 days",
  "7d":  "Last 7 days",
};

/**
 * Same colours as the jobs-posted chart (job-status-colors.ts): a status
 * keeps one colour on the whole dashboard. Statuses outside the job lifecycle
 * (drafts, unpaid) fall back to a neutral grey.
 */
const chartConfig = {
  count: { label: "Jobs" },
  ...jobStatusChartConfig,
  PENDING_PAYMENT: { label: "Pending payment", color: "#898781" },
  DRAFT: { label: "Draft", color: "#898781" },
} satisfies ChartConfig;

export function ChartJobStatusPie() {
  const [timeRange] = useQueryState(TIME_RANGE_QUERY_KEY, timeRangeParser);
  const range = timeRange ?? "90d";

  const { data = [] } = useQuery({
    queryKey: ["admin", "dashboard", "job-status-distribution", range],
    queryFn: () => getJobStatusDistribution({ range }),
  });

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      status: d.status,
      count: d.count,
      fill: `var(--color-${d.status})`,
    }));

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Job status distribution</CardTitle>
        <CardDescription>{DESCRIPTION_LABELS[range]}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[320px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="status" hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive
              animationBegin={100}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`${entry.status}-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={
                <ChartLegendContent
                  nameKey="status"
                  className="flex-wrap gap-y-1"
                />
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
