import { useId, useMemo } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { useQuery } from "@tanstack/react-query";
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
import { getMonthlyRevenue } from "#/lib/api/wallet-controller";

const BASE_COLOR = "hsl(217 91% 60%)";

const chartConfig = {
  revenue: {
    label: "Revenue (FCFA)",
    color: BASE_COLOR,
  },
} satisfies ChartConfig;

function formatMonthLabel(month: string): string {
  return new Date(month + "-01").toLocaleString("en", { month: "short" });
}

export function WalletRevenueRadarChart() {
  const gradBaseId = `radarg${useId().replaceAll(/[^a-zA-Z0-9_-]/g, "")}`;

  const { data: raw = [] } = useQuery({
    queryKey: ["admin", "wallet", "monthly-revenue"],
    queryFn: () => getMonthlyRevenue(12),
  });

  const last6 = raw.slice(-6);

  const chartData = last6.map((d) => ({
    ...d,
    monthLabel: formatMonthLabel(d.month),
  }));

  const firstMonth = last6.length > 0 ? formatMonthLabel(last6[0].month) : "";
  const lastMonth =
    last6.length > 0 ? formatMonthLabel(last6[last6.length - 1].month) : "";
  const year =
    last6.length > 0 ? last6[last6.length - 1].month.slice(0, 4) : "";

  // memoised so the gradient id is stable across renders
  const gradientId = useMemo(() => `${gradBaseId}-radar-fill`, [gradBaseId]);

  return (
    <Card className="flex h-[320px] flex-col overflow-hidden">
      <CardHeader className="items-center pb-0">
        <CardTitle>Revenue Distribution</CardTitle>
        <CardDescription>
          {firstMonth} – {lastMonth} {year}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full aspect-auto!"
        >
          <RadarChart data={chartData}>
            <defs>
              <radialGradient id={gradientId} cx="50%" cy="50%" r="78%">
                <stop offset="0%" stopColor={BASE_COLOR} stopOpacity={0.38} />
                <stop offset="50%" stopColor={BASE_COLOR} stopOpacity={0.8} />
                <stop offset="100%" stopColor={BASE_COLOR} stopOpacity={0.42} />
              </radialGradient>
            </defs>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="monthLabel" />
            <PolarGrid />
            <Radar
              dataKey="revenue"
              fill={`url(#${gradientId})`}
              stroke={BASE_COLOR}
              strokeWidth={1.5}
              dot={{
                r: 4,
                fill: BASE_COLOR,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
