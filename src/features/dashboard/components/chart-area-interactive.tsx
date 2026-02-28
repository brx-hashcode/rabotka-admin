import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "#/hooks/use-mobile";
import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";

export const description = "An interactive area chart";

const chartData = [
  { date: "2024-04-01", jobCreated: 222, jobFilled: 150 },
  { date: "2024-04-02", jobCreated: 97, jobFilled: 180 },
  { date: "2024-04-03", jobCreated: 167, jobFilled: 120 },
  { date: "2024-04-04", jobCreated: 242, jobFilled: 260 },
  { date: "2024-04-05", jobCreated: 373, jobFilled: 290 },
  { date: "2024-04-06", jobCreated: 301, jobFilled: 340 },
  { date: "2024-04-07", jobCreated: 245, jobFilled: 180 },
  { date: "2024-04-08", jobCreated: 409, jobFilled: 320 },
  { date: "2024-04-09", jobCreated: 59, jobFilled: 110 },
  { date: "2024-04-10", jobCreated: 261, jobFilled: 190 },
  { date: "2024-04-11", jobCreated: 327, jobFilled: 350 },
  { date: "2024-04-12", jobCreated: 292, jobFilled: 210 },
  { date: "2024-04-13", jobCreated: 342, jobFilled: 380 },
  { date: "2024-04-14", jobCreated: 137, jobFilled: 220 },
  { date: "2024-04-15", jobCreated: 120, jobFilled: 170 },
  { date: "2024-04-16", jobCreated: 138, jobFilled: 190 },
  { date: "2024-04-17", jobCreated: 446, jobFilled: 360 },
  { date: "2024-04-18", jobCreated: 364, jobFilled: 410 },
  { date: "2024-04-19", jobCreated: 243, jobFilled: 180 },
  { date: "2024-04-20", jobCreated: 89, jobFilled: 150 },
  { date: "2024-04-21", jobCreated: 137, jobFilled: 200 },
  { date: "2024-04-22", jobCreated: 224, jobFilled: 170 },
  { date: "2024-04-23", jobCreated: 138, jobFilled: 230 },
  { date: "2024-04-24", jobCreated: 387, jobFilled: 290 },
  { date: "2024-04-25", jobCreated: 215, jobFilled: 250 },
  { date: "2024-04-26", jobCreated: 75, jobFilled: 130 },
  { date: "2024-04-27", jobCreated: 383, jobFilled: 420 },
  { date: "2024-04-28", jobCreated: 122, jobFilled: 180 },
  { date: "2024-04-29", jobCreated: 315, jobFilled: 240 },
  { date: "2024-04-30", jobCreated: 454, jobFilled: 380 },
  { date: "2024-05-01", jobCreated: 165, jobFilled: 220 },
  { date: "2024-05-02", jobCreated: 293, jobFilled: 310 },
  { date: "2024-05-03", jobCreated: 247, jobFilled: 190 },
  { date: "2024-05-04", jobCreated: 385, jobFilled: 420 },
  { date: "2024-05-05", jobCreated: 481, jobFilled: 390 },
  { date: "2024-05-06", jobCreated: 498, jobFilled: 520 },
  { date: "2024-05-07", jobCreated: 388, jobFilled: 300 },
  { date: "2024-05-08", jobCreated: 149, jobFilled: 210 },
  { date: "2024-05-09", jobCreated: 227, jobFilled: 180 },
  { date: "2024-05-10", jobCreated: 293, jobFilled: 330 },
  { date: "2024-05-11", jobCreated: 335, jobFilled: 270 },
  { date: "2024-05-12", jobCreated: 197, jobFilled: 240 },
  { date: "2024-05-13", jobCreated: 197, jobFilled: 160 },
  { date: "2024-05-14", jobCreated: 448, jobFilled: 490 },
  { date: "2024-05-15", jobCreated: 473, jobFilled: 380 },
  { date: "2024-05-16", jobCreated: 338, jobFilled: 400 },
  { date: "2024-05-17", jobCreated: 499, jobFilled: 420 },
  { date: "2024-05-18", jobCreated: 315, jobFilled: 350 },
  { date: "2024-05-19", jobCreated: 235, jobFilled: 180 },
  { date: "2024-05-20", jobCreated: 177, jobFilled: 230 },
  { date: "2024-05-21", jobCreated: 82, jobFilled: 140 },
  { date: "2024-05-22", jobCreated: 81, jobFilled: 120 },
  { date: "2024-05-23", jobCreated: 252, jobFilled: 290 },
  { date: "2024-05-24", jobCreated: 294, jobFilled: 220 },
  { date: "2024-05-25", jobCreated: 201, jobFilled: 250 },
  { date: "2024-05-26", jobCreated: 213, jobFilled: 170 },
  { date: "2024-05-27", jobCreated: 420, jobFilled: 460 },
  { date: "2024-05-28", jobCreated: 233, jobFilled: 190 },
  { date: "2024-05-29", jobCreated: 78, jobFilled: 130 },
  { date: "2024-05-30", jobCreated: 340, jobFilled: 280 },
  { date: "2024-05-31", jobCreated: 178, jobFilled: 230 },
  { date: "2024-06-01", jobCreated: 178, jobFilled: 200 },
  { date: "2024-06-02", jobCreated: 470, jobFilled: 410 },
  { date: "2024-06-03", jobCreated: 103, jobFilled: 160 },
  { date: "2024-06-04", jobCreated: 439, jobFilled: 380 },
  { date: "2024-06-05", jobCreated: 88, jobFilled: 140 },
  { date: "2024-06-06", jobCreated: 294, jobFilled: 250 },
  { date: "2024-06-07", jobCreated: 323, jobFilled: 370 },
  { date: "2024-06-08", jobCreated: 385, jobFilled: 320 },
  { date: "2024-06-09", jobCreated: 438, jobFilled: 480 },
  { date: "2024-06-10", jobCreated: 155, jobFilled: 200 },
  { date: "2024-06-11", jobCreated: 92, jobFilled: 150 },
  { date: "2024-06-12", jobCreated: 492, jobFilled: 420 },
  { date: "2024-06-13", jobCreated: 81, jobFilled: 130 },
  { date: "2024-06-14", jobCreated: 426, jobFilled: 380 },
  { date: "2024-06-15", jobCreated: 307, jobFilled: 350 },
  { date: "2024-06-16", jobCreated: 371, jobFilled: 310 },
  { date: "2024-06-17", jobCreated: 475, jobFilled: 520 },
  { date: "2024-06-18", jobCreated: 107, jobFilled: 170 },
  { date: "2024-06-19", jobCreated: 341, jobFilled: 290 },
  { date: "2024-06-20", jobCreated: 408, jobFilled: 450 },
  { date: "2024-06-21", jobCreated: 169, jobFilled: 210 },
  { date: "2024-06-22", jobCreated: 317, jobFilled: 270 },
  { date: "2024-06-23", jobCreated: 480, jobFilled: 530 },
  { date: "2024-06-24", jobCreated: 132, jobFilled: 180 },
  { date: "2024-06-25", jobCreated: 141, jobFilled: 190 },
  { date: "2024-06-26", jobCreated: 434, jobFilled: 380 },
  { date: "2024-06-27", jobCreated: 448, jobFilled: 490 },
  { date: "2024-06-28", jobCreated: 149, jobFilled: 200 },
  { date: "2024-06-29", jobCreated: 103, jobFilled: 160 },
  { date: "2024-06-30", jobCreated: 446, jobFilled: 400 },
];

const chartConfig = {
  jobs: { label: "Jobs" },
  jobCreated: { label: "Job created", color: "#3b82f6" },
  jobFilled: { label: "Job filled", color: "var(--primary)" },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d");
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") daysToSubtract = 30;
    else if (timeRange === "7d") daysToSubtract = 7;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Job Activity</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Jobs posted vs jobs filled over the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months activity</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
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
