import { Pie, PieChart } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "#/components/ui/chart";
import { TIME_RANGE_QUERY_KEY, timeRangeParser } from "./chart-area-filter";
import { getJobStatusDistribution } from "#/lib/api/dashboard-controller";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  PENDING_PAYMENT: { label: "Pending payment", color: "hsl(215 10% 75%)" },
  DRAFT:           { label: "Draft",           color: "hsl(215 20% 65%)" },
  ACTIVE:          { label: "Active",          color: "hsl(217 91% 60%)" },
  PARTIALLY_FILLED:{ label: "Partially filled",color: "hsl(262 83% 68%)" },
  FILLED:          { label: "Filled",          color: "hsl(25 95% 58%)" },
  IN_PROGRESS:     { label: "In progress",     color: "hsl(191 80% 52%)" },
  COMPLETED:       { label: "Completed",       color: "hsl(142 69% 52%)" },
  CANCELLED:       { label: "Cancelled",       color: "hsl(0 84% 62%)" },
  EXPIRED:         { label: "Expired",         color: "hsl(20 60% 55%)" },
};

const DESCRIPTION_LABELS: Record<string, string> = {
  "90d": "Last 3 months",
  "30d": "Last 30 days",
  "7d":  "Last 7 days",
};

const chartConfig = {
  count: { label: "Jobs" },
  ...Object.fromEntries(
    Object.entries(STATUS_CONFIG).map(([key, { label, color }]) => [
      key,
      { label, color },
    ]),
  ),
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
      fill: STATUS_CONFIG[d.status]?.color ?? "hsl(215 20% 65%)",
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
              isAnimationActive
              animationBegin={100}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
