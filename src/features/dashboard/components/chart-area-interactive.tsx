import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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
import { getJobActivity } from "#/lib/api/dashboard-controller";

const chartConfig = {
  jobs: { label: "Jobs" },
  jobCreated: { label: "Job created", color: "#3b82f6" },
  jobFilled: { label: "Job filled", color: "var(--primary)" },
} satisfies ChartConfig;

const DESCRIPTION_LABELS: Record<string, string> = {
  "90d": "Jobs posted vs filled — last 3 months",
  "30d": "Jobs posted vs filled — last 30 days",
  "7d": "Jobs posted vs filled — last 7 days",
};

export function ChartAreaInteractive() {
  const [timeRange] = useQueryState(TIME_RANGE_QUERY_KEY, timeRangeParser);
  const range = timeRange ?? "90d";

  const { data: chartData = [] } = useQuery({
    queryKey: ["admin", "dashboard", "job-activity", range],
    queryFn: () => getJobActivity({ range }),
  });

  return (
    <Card className="@container/card h-full">
      <CardHeader>
        <CardTitle>Jobs posted vs filled</CardTitle>
        <CardDescription>{DESCRIPTION_LABELS[range]}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillJobCreated" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-jobCreated)"
                  stopOpacity={1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-jobCreated)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillJobFilled" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-jobFilled)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-jobFilled)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="jobFilled"
              type="natural"
              fill="url(#fillJobFilled)"
              stroke="var(--color-jobFilled)"
              stackId="a"
            />
            <Area
              dataKey="jobCreated"
              type="natural"
              fill="url(#fillJobCreated)"
              stroke="var(--color-jobCreated)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
