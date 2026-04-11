import { useId, useMemo } from "react";
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

function defaultStatusColor(status: string): string {
  return STATUS_CONFIG[status]?.color ?? "hsl(215 20% 65%)";
}

/** Safe fragment for SVG gradient ids (XML Name + URL fragment rules). */
function gradientKeyForStatus(status: string): string {
  return status.replaceAll(/[^a-zA-Z0-9_-]/g, "_");
}

export function ChartJobStatusPie() {
  const [timeRange] = useQueryState(TIME_RANGE_QUERY_KEY, timeRangeParser);
  const range = timeRange ?? "90d";
  const gradBaseId = `pieg${useId().replaceAll(/[^a-zA-Z0-9_-]/g, "")}`;

  const { data = [] } = useQuery({
    queryKey: ["admin", "dashboard", "job-status-distribution", range],
    queryFn: () => getJobStatusDistribution({ range }),
  });

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      status: d.status,
      count: d.count,
      fill: defaultStatusColor(d.status),
    }));

  const gradientSlices = useMemo(() => {
    const map = new Map<string, { status: string; color: string }>();
    for (const row of chartData) {
      if (!map.has(row.status)) {
        map.set(row.status, {
          status: row.status,
          color: defaultStatusColor(row.status),
        });
      }
    }
    return [...map.values()];
  }, [chartData]);

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
            {/* Recharts drops non-SVG custom children; defs must be intrinsic <defs>. */}
            <defs>
              {gradientSlices.map(({ status, color }) => (
                <radialGradient
                  key={status}
                  id={`${gradBaseId}-pie-${gradientKeyForStatus(status)}`}
                  cx="50%"
                  cy="50%"
                  r="78%"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.58} />
                  <stop offset="50%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.52} />
                </radialGradient>
              ))}
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="status" hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              stroke="var(--background)"
              strokeWidth={2}
              isAnimationActive
              animationBegin={100}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`${entry.status}-${index}`}
                  fill={`url(#${gradBaseId}-pie-${gradientKeyForStatus(entry.status)})`}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
