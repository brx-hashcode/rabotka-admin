import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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

const chartConfig = {
  revenue: {
    label: "Revenue (FCFA)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatMonthLabel(month: string): string {
  return new Date(month + "-01").toLocaleString("en", { month: "short" });
}

export function WalletRevenueBarChart() {
  const calendarYear = new Date().getFullYear();

  const { data: raw = [] } = useQuery({
    queryKey: ["admin", "wallet", "monthly-revenue", calendarYear],
    queryFn: () => getMonthlyRevenue(calendarYear),
  });

  const chartData = raw.map((d) => ({
    ...d,
    monthLabel: formatMonthLabel(d.month),
  }));

  return (
    <Card className="flex h-[320px] flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
        <CardDescription>
          Jan – Dec {calendarYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 pb-4">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full aspect-auto!"
        >
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
