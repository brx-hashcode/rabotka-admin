import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "#/components/ui/chart";
import { Skeleton } from "#/components/ui/skeleton";
import {
  getBroadcastStats,
  type RecipientStatus,
} from "#/lib/api/broadcasts-controller";

/**
 * A STATUS palette: these four colours carry a fixed meaning and are never
 * re-assigned to something else.
 *
 * Validated against both surfaces — worst adjacent pair ΔE 17.6 under
 * deuteranopia, 22.0 under tritanopia. Read is violet rather than the obvious
 * cyan: cyan sits ΔE 5.7 from the green beside it for tritanopia, close enough
 * that the two would blur into one.
 *
 * Pending is deliberately the one low-chroma step. Grey IS its meaning —
 * nothing has happened to it yet — and each bar is named on the axis and
 * labelled with its count, so nothing here is read by colour alone.
 */
const STATUS_STYLE: Record<
  RecipientStatus,
  { label: string; color: string }
> = {
  SENT: { label: "Sent", color: "#30d96e" },
  READ: { label: "Read", color: "#9a56d6" },
  FAILED: { label: "Failed", color: "#ef4d4d" },
  PENDING: { label: "Pending", color: "#b9bec6" },
};

/** Left to right in the order a delivery actually moves through. */
const STATUS_ORDER: RecipientStatus[] = ["SENT", "READ", "FAILED", "PENDING"];

const chartConfig = {
  count: { label: "Deliveries" },
  ...Object.fromEntries(
    STATUS_ORDER.map((status) => [
      status,
      { label: STATUS_STYLE[status].label, color: STATUS_STYLE[status].color },
    ]),
  ),
} satisfies ChartConfig;

/**
 * What became of every delivery, one bar per status.
 *
 * The counters above carry the same four numbers as text; the bars carry their
 * relative size, which is the part a number cannot show at a glance — 40 sent
 * against 1 failed reads very differently from 20 against 21, and both are
 * "some failed" in a counter.
 *
 * Every delivery is counted, unlike the recipients list below, which is
 * paginated at 50.
 */
export function DeliveryChart({
  broadcastId,
  live,
}: Readonly<{
  broadcastId: string;
  /** The broadcast is still working: keep the breakdown refreshing. */
  live: boolean;
}>) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "broadcasts", broadcastId, "stats"],
    queryFn: () => getBroadcastStats(broadcastId),
    // Driven by the BROADCAST's state, not by what this query last saw. Polling
    // on "some row is still PENDING" stopped the moment a page failed outright
    // — which is exactly when the numbers are still moving.
    refetchInterval: live ? 5_000 : false,
  });

  if (isLoading) {
    return (
      <section className="bg-card shadow-soft space-y-3 rounded-lg p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-55 w-full" />
      </section>
    );
  }

  const bars = toBars(data?.byChannel ?? []);
  if (bars.length === 0) return null;

  return (
    <section className="bg-card shadow-soft space-y-3 rounded-lg p-4">
      <div>
        <h2 className="text-sm font-medium">Delivery status</h2>
        <p className="text-muted-foreground text-xs">
          Every delivery counted, not just the page below.
        </p>
      </div>

      <ChartContainer config={chartConfig} className="h-55 w-full">
        <BarChart
          accessibilityLayer
          data={bars}
          margin={{ left: 4, right: 4, top: 20, bottom: 4 }}
        >
          {/* Recessive: horizontal only, so the grid measures the bars without
              competing with them. */}
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
            className="text-xs"
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="label" hideLabel />}
          />
          {/* One series, so no legend: the axis already names every bar. */}
          <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {bars.map((bar) => (
              <Cell key={bar.status} fill={bar.fill} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              offset={8}
              className="fill-foreground text-xs font-medium"
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </section>
  );
}

type BarDatum = {
  status: RecipientStatus;
  label: string;
  count: number;
  fill: string;
};

/**
 * Totals per status across every channel, in the fixed status order.
 *
 * A status with no deliveries is dropped rather than drawn at zero: an empty
 * bar reads as a state something reached and failed to leave, when in fact
 * nothing was ever in it.
 */
function toBars(stats: { status: RecipientStatus; count: number }[]): BarDatum[] {
  const totals = new Map<RecipientStatus, number>();

  for (const stat of stats) {
    totals.set(stat.status, (totals.get(stat.status) ?? 0) + stat.count);
  }

  return STATUS_ORDER.filter((status) => (totals.get(status) ?? 0) > 0).map(
    (status) => ({
      status,
      label: STATUS_STYLE[status].label,
      count: totals.get(status) ?? 0,
      fill: STATUS_STYLE[status].color,
    }),
  );
}
