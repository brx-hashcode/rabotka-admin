import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
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
import { Skeleton } from "#/components/ui/skeleton";
import { getFeedbackStats } from "#/lib/api/feedback-controller";

const distributionConfig = {
  count: { label: "Avis", color: "var(--chart-2)" },
} satisfies ChartConfig;

const trendConfig = {
  count: { label: "Avis", color: "var(--chart-2)" },
} satisfies ChartConfig;

const STAR = "★";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function FeedbackStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback", "stats", 30],
    queryFn: () => getFeedbackStats(30),
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const commentRate = data.total
    ? Math.round((data.withComment / data.total) * 100)
    : 0;

  const worker = data.byProfileType.find((t) => t.profileType === "WORKER");
  const employer = data.byProfileType.find((t) => t.profileType === "EMPLOYER");

  const distribution = data.distribution.map((d) => ({
    ...d,
    label: `${d.score}${STAR}`,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatTile
          label="Note moyenne"
          value={data.total ? `${data.average.toFixed(2)} / 5` : "—"}
          hint={`Sur ${data.total} avis au total`}
        />
        <StatTile
          label="Avis reçus"
          value={String(data.total)}
          hint="Depuis le lancement"
        />
        <StatTile
          label="Avec commentaire"
          value={data.total ? `${commentRate}%` : "—"}
          hint={`${data.withComment} avis commentés`}
        />
        <StatTile
          label="Travailleurs / Employeurs"
          value={`${worker?.average?.toFixed(1) ?? "—"} / ${employer?.average?.toFixed(1) ?? "—"}`}
          hint={`${worker?.count ?? 0} et ${employer?.count ?? 0} avis`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex h-[320px] flex-col overflow-hidden shadow-soft">
          <CardHeader>
            <CardTitle>Répartition des notes</CardTitle>
            <CardDescription>Nombre d’avis par note</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 pb-4">
            <ChartContainer
              config={distributionConfig}
              className="aspect-auto! h-full w-full"
            >
              <BarChart accessibilityLayer data={distribution} margin={{ top: 16 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    className="fill-muted-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex h-[320px] flex-col overflow-hidden shadow-soft">
          <CardHeader>
            <CardTitle>Avis dans le temps</CardTitle>
            <CardDescription>30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 pb-4">
            {data.trend.length === 0 ? (
              <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
                Aucun avis sur la période
              </div>
            ) : (
              <ChartContainer
                config={trendConfig}
                className="aspect-auto! h-full w-full"
              >
                <AreaChart accessibilityLayer data={data.trend}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v: string) =>
                      new Date(v).toLocaleDateString("fr", {
                        day: "numeric",
                        month: "short",
                      })
                    }
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent labelKey="date" />}
                  />
                  <Area
                    dataKey="count"
                    type="monotone"
                    stroke="var(--color-count)"
                    fill="var(--color-count)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
