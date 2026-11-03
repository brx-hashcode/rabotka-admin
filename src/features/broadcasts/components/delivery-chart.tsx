import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "#/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type {
  BroadcastChannel,
  BroadcastStats,
  RecipientStatus,
} from "#/lib/api/broadcasts-controller";
import { CHANNEL_ICONS, CHANNEL_LABELS } from "./broadcast-columns";

/**
 * A STATUS palette: these four colours carry a fixed meaning and are never
 * re-assigned to something else.
 *
 * Validated against both surfaces — worst adjacent pair ΔE 17.6 under
 * deuteranopia, 22.0 under tritanopia. Read is violet rather than the obvious
 * cyan: cyan sits ΔE 5.7 from the green beside it for tritanopia, close enough
 * that the two would blur into one. Pending is the one low-chroma step: grey
 * IS its meaning. Every segment is also named with its count, so nothing here
 * is read by colour alone.
 */
export const STATUS_STYLE: Record<RecipientStatus, { label: string; color: string }> = {
  SENT: { label: "Delivered", color: "#30d96e" },
  READ: { label: "Read", color: "#9a56d6" },
  FAILED: { label: "Failed", color: "#ef4d4d" },
  PENDING: { label: "Pending", color: "#b9bec6" },
};

/** Left to right in the order a delivery moves through. */
const STATUS_ORDER: RecipientStatus[] = ["SENT", "READ", "FAILED", "PENDING"];

/** Line colours for the channels on the curve. */
const CHANNEL_COLOR: Record<BroadcastChannel, string> = {
  IN_APP: "#9a56d6",
  WHATSAPP: "#30d96e",
  EMAIL: "#3b82f6",
};

const nf = (n: number) => n.toLocaleString("fr-FR");

type ChannelRow = {
  channel: BroadcastChannel;
  total: number;
  counts: Record<RecipientStatus, number>;
};

function byChannel(stats: BroadcastStats["byChannel"]): ChannelRow[] {
  const rows = new Map<BroadcastChannel, ChannelRow>();
  for (const s of stats) {
    const row = rows.get(s.channel) ?? {
      channel: s.channel,
      total: 0,
      counts: { SENT: 0, READ: 0, FAILED: 0, PENDING: 0 },
    };
    row.counts[s.status] += s.count;
    row.total += s.count;
    rows.set(s.channel, row);
  }
  return [...rows.values()].sort((a, b) => b.total - a.total);
}

/**
 * What became of every delivery, one bar per channel: delivered, read (in-app
 * only), failed, still pending. Then, when the send spread over more than a
 * minute, how it went out over time.
 *
 * Every delivery is counted, unlike the recipients list, which is paginated.
 */
export function DeliveryBreakdown({
  stats,
  isLoading,
}: Readonly<{ stats: BroadcastStats | undefined; isLoading: boolean }>) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-5">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const rows = byChannel(stats?.byChannel ?? []);
  const timeline = stats?.timeline ?? [];
  const channels = rows.map((r) => r.channel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Delivery</CardTitle>
        <p className="text-muted-foreground text-xs">
          Every delivery, by channel. Read is reported by in-app only.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing delivered yet. The audience is frozen when the broadcast is
            sent.
          </p>
        ) : (
          rows.map((row) => <ChannelBar key={row.channel} row={row} />)
        )}

        {rows.length > 0 ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {STATUS_ORDER.map((status) => (
              <span
                key={status}
                className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: STATUS_STYLE[status].color }}
                />
                {STATUS_STYLE[status].label}
              </span>
            ))}
          </div>
        ) : null}

        {timeline.length >= 2 ? (
          <Timeline points={timeline} channels={channels} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChannelBar({ row }: Readonly<{ row: ChannelRow }>) {
  const Icon = CHANNEL_ICONS[row.channel];
  const reached = row.counts.SENT + row.counts.READ;
  const pct = row.total ? Math.round((reached / row.total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          {Icon ? <Icon className="text-muted-foreground size-4" /> : null}
          {CHANNEL_LABELS[row.channel] ?? row.channel}
        </span>
        <span className="text-sm tabular-nums">
          {nf(reached)}
          <span className="text-muted-foreground"> / {nf(row.total)} · {pct} %</span>
        </span>
      </div>
      <div className="bg-muted flex h-2.5 overflow-hidden rounded-full">
        {STATUS_ORDER.map((status) =>
          row.counts[status] > 0 ? (
            <div
              key={status}
              title={`${STATUS_STYLE[status].label}: ${nf(row.counts[status])}`}
              className="h-full"
              style={{
                width: `${(row.counts[status] / row.total) * 100}%`,
                backgroundColor: STATUS_STYLE[status].color,
              }}
            />
          ) : null,
        )}
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs tabular-nums">
        {STATUS_ORDER.filter((s) => row.counts[s] > 0).map((s) => (
          <span key={s}>
            {nf(row.counts[s])} {STATUS_STYLE[s].label.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

function Timeline({
  points,
  channels,
}: Readonly<{
  points: BroadcastStats["timeline"];
  channels: BroadcastChannel[];
}>) {
  const config = Object.fromEntries(
    channels.map((c) => [c, { label: CHANNEL_LABELS[c] ?? c, color: CHANNEL_COLOR[c] }]),
  ) satisfies ChartConfig;
  const data = points.map((p) => ({
    ...p,
    time: new Date(p.at).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Over time</p>
      <ChartContainer config={config} className="h-44 w-full">
        <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={36}
            allowDecimals={false}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {channels.map((c) => (
            <Area
              key={c}
              dataKey={c}
              type="monotone"
              stroke={`var(--color-${c})`}
              fill={`var(--color-${c})`}
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
