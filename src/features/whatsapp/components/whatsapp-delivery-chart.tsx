import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
import type { WhatsappStats } from "#/lib/api/whatsapp-controller";

/**
 * Sent / delivered / read / failed, per day.
 *
 * Lines rather than a stacked area, because these series are NESTED, not
 * additive: every delivered message is also a sent one. Stacking them would
 * draw a total that is three times the real volume — the classic way to make a
 * delivery chart lie.
 */

const chartConfig = {
  sent: { label: "Sent", color: "#3b82f6" },
  delivered: { label: "Delivered", color: "#10b981" },
  read: { label: "Read", color: "#8b5cf6" },
  failed: { label: "Failed", color: "#e11d48" },
} satisfies ChartConfig;

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function WhatsappDeliveryChart({
  stats,
}: Readonly<{ stats: WhatsappStats | undefined }>) {
  const data = stats?.timeline ?? [];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Delivery over time</CardTitle>
        <CardDescription>
          Each line counts the messages that reached that stage. They are
          nested, not additive — every delivered message was also sent.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <LineChart data={data} margin={{ left: 4, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatDay}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDay(String(value))}
                  indicator="dot"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="sent"
              type="monotone"
              stroke="var(--color-sent)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="delivered"
              type="monotone"
              stroke="var(--color-delivered)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="read"
              type="monotone"
              stroke="var(--color-read)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="failed"
              type="monotone"
              stroke="var(--color-failed)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
