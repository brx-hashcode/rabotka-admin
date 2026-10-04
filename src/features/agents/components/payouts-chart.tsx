import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { IconChartArea, IconTable } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { useWithdrawalTimeseries } from "#/hooks/use-agents";
import type {
  PayoutTimeseriesPoint,
  PayoutTimeseriesRange,
} from "#/lib/api/agents-controller";
import { formatFcfa } from "../agent-rules";

type Series = "toPay" | "paid" | "rejected";

const SERIES: Series[] = ["toPay", "paid", "rejected"];

/**
 * Amber, teal, rose — the status hues of the badges, at steps that pass the
 * colour-vision and contrast checks on both the light and the dark card
 * (validated with the dataviz palette validator). Paid is teal rather than
 * the badge's emerald: emerald against rose collapses for deutan readers.
 */
const chartConfig = {
  toPay: { label: "To pay", color: "#d97706" },
  paid: { label: "Paid", color: "#0d9488" },
  rejected: { label: "Rejected", color: "#e11d48" },
} satisfies ChartConfig;

const RANGES: { days: PayoutTimeseriesRange; label: string }[] = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 3 months" },
  { days: 180, label: "Last 6 months" },
];

const shortFcfa = (v: number) =>
  v >= 1000 ? `${(v / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}k` : String(v);

/**
 * The payout queue over time. "To pay" is the backlog — what was still
 * waiting at the end of each day; "Paid" and "Rejected" are what was
 * processed that day. All three in FCFA, on one axis.
 */
export function PayoutsChart() {
  const [days, setDays] = useState<PayoutTimeseriesRange>(30);
  const [asTable, setAsTable] = useState(false);
  const { data, isLoading } = useWithdrawalTimeseries(days);

  const points = useMemo(
    () =>
      (data?.points ?? []).map((p: PayoutTimeseriesPoint) => ({
        date: p.date,
        toPay: p.toPay.amount,
        paid: p.paid.amount,
        rejected: p.rejected.amount,
        counts: {
          toPay: p.toPay.count,
          paid: p.paid.count,
          rejected: p.rejected.count,
        },
      })),
    [data],
  );
  const allZero = points.every((p) => !p.toPay && !p.paid && !p.rejected);
  const rangeLabel = RANGES.find((r) => r.days === days)?.label ?? "";

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-col gap-3 px-6 pt-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-1">
          <CardTitle>Payouts over time</CardTitle>
          <CardDescription>
            What was waiting to be paid at the end of each day, and what was
            paid or rejected — {rangeLabel.toLowerCase()}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAsTable((t) => !t)}
            aria-pressed={asTable}
          >
            {asTable ? (
              <IconChartArea className="size-4" />
            ) : (
              <IconTable className="size-4" />
            )}
            {asTable ? "Chart" : "Table"}
          </Button>
          <Select
            value={String(days)}
            onValueChange={(v) => setDays(Number(v) as PayoutTimeseriesRange)}
          >
            <SelectTrigger className="w-40" aria-label="Period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {RANGES.map((r) => (
                <SelectItem key={r.days} value={String(r.days)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <CardContent className="px-2 pt-4 pb-4 sm:px-6">
        {isLoading && <Skeleton className="h-[280px] w-full" />}

        {!isLoading && asTable && <PayoutTable points={points} />}

        {!isLoading && !asTable && (
          <div className="relative">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[280px] w-full"
            >
              <AreaChart
                accessibilityLayer
                data={points}
                margin={{ left: 0, right: 8, top: 8 }}
              >
                <defs>
                  {SERIES.map((key) => (
                    <linearGradient
                      key={key}
                      id={`fill-${key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={`var(--color-${key})`}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={`var(--color-${key})`}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                  tickCount={4}
                  tickFormatter={shortFcfa}
                />
                <ChartTooltip
                  cursor={{ strokeOpacity: 0.4 }}
                  content={
                    <ChartTooltipContent
                      className="w-56"
                      indicator="dot"
                      labelFormatter={(d: string) =>
                        format(parseISO(d), "EEE d MMM yyyy")
                      }
                      formatter={(value, name, item) => {
                        const key = name as Series;
                        const count = (
                          item.payload as { counts: Record<Series, number> }
                        ).counts[key];
                        return (
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="size-2.5 rounded-[2px]"
                                style={{ background: chartConfig[key].color }}
                              />
                              <span className="text-muted-foreground">
                                {chartConfig[key].label}
                              </span>
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatFcfa(Number(value))}
                              <span className="text-muted-foreground font-sans font-normal">
                                {" "}
                                · {count}
                              </span>
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                {SERIES.map((key) => (
                  <Area
                    key={key}
                    dataKey={key}
                    type="monotone"
                    stroke={`var(--color-${key})`}
                    strokeWidth={2}
                    fill={`url(#fill-${key})`}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
            {allZero && (
              <p className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
                No withdrawal in this period.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** The same days as rows: the non-visual view, newest first. */
function PayoutTable({
  points,
}: Readonly<{
  points: {
    date: string;
    toPay: number;
    paid: number;
    rejected: number;
    counts: Record<Series, number>;
  }[];
}>) {
  const rows = [...points]
    .reverse()
    .filter((p) => p.toPay || p.paid || p.rejected);
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        No withdrawal in this period.
      </p>
    );
  }
  return (
    <div className="max-h-[280px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground bg-card sticky top-0 text-xs">
          <tr>
            <th className="py-2 text-left font-medium">Day</th>
            <th className="py-2 text-right font-medium">To pay</th>
            <th className="py-2 text-right font-medium">Paid</th>
            <th className="py-2 text-right font-medium">Rejected</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((p) => (
            <tr key={p.date}>
              <td className="py-2">{format(parseISO(p.date), "EEE d MMM")}</td>
              {SERIES.map((key) => (
                <td key={key} className="py-2 text-right tabular-nums">
                  {p[key] ? (
                    <>
                      {formatFcfa(p[key])}
                      <span className="text-muted-foreground"> · {p.counts[key]}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
