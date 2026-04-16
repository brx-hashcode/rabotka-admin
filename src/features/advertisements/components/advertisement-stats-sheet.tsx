import { useMemo, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
} from "recharts";
import {
  ChartColumnIncreasing,
  MailOpen,
  MousePointerClick,
  Send,
} from "lucide-react";

import { DataTable, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import { useAdvertisementAnalytics } from "#/hooks/use-advertisement-analytics";
import type {
  Advertisement,
  AdvertisementDeliveryLogItem,
} from "#/lib/api/advertisements-controller";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: Advertisement;
};

const timelineChartConfig = {
  sent: { label: "Sent", color: "var(--chart-1)" },
  clicked: { label: "Clicked", color: "var(--chart-2)" },
} satisfies ChartConfig;

const radialChartConfig = {
  clicked: { label: "Clicks", color: "var(--chart-2)" },
  remaining: { label: "Remaining", color: "var(--muted)" },
} satisfies ChartConfig;

function getChannelBadgeClass(channel: string): string {
  switch (channel) {
    case "EMAIL":
      return "bg-sky-500 text-white border-transparent";
    case "WHATSAPP":
      return "bg-green-600 text-white border-transparent";
    default:
      return "bg-zinc-500 text-white border-transparent";
  }
}

function getDeliveryStatusBadgeClass(status: string): string {
  switch (status) {
    case "CLICKED":
      return "bg-violet-600 text-white border-transparent";
    case "OPENED":
      return "bg-emerald-500 text-white border-transparent";
    case "DELIVERED":
      return "bg-blue-500 text-white border-transparent";
    case "FAILED":
      return "bg-rose-600 text-white border-transparent";
    default:
      return "bg-zinc-500 text-white border-transparent";
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function StatsCard({
  title,
  description,
  value,
  icon,
  iconClassName,
}: Readonly<{
  title: string;
  description: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
}>) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <span
          className={`inline-flex size-7 items-center justify-center rounded-md ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function makeDeliveryLogColumns(): ColumnDef<AdvertisementDeliveryLogItem>[] {
  return [
    {
      id: "profile",
      header: "Profile",
      cell: ({ row }) => (
        <ProfileCell
          name={row.original.profileName}
          email={row.original.profileEmail}
          avatarUrl={null}
        />
      ),
    },
    {
      id: "channel",
      header: "Channel",
      cell: ({ row }) => (
        <Badge className={getChannelBadgeClass(row.original.channel)}>
          {row.original.channel}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={getDeliveryStatusBadgeClass(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "sentAt",
      header: "Sent At",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {formatDateTime(row.original.sentAt)}
        </span>
      ),
    },
    {
      accessorKey: "clickedAt",
      header: "Clicked At",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {formatDateTime(row.original.clickedAt)}
        </span>
      ),
    },
    {
      accessorKey: "failureReason",
      header: "Failure",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.failureReason || "—"}
        </span>
      ),
    },
  ];
}

function renderRadialLabel(clickRate: number) {
  return ({ viewBox }: { viewBox?: { cx?: number; cy?: number } }) => {
    if (viewBox?.cx == null || viewBox?.cy == null) {
      return null;
    }

    return (
      <text
        x={viewBox.cx}
        y={viewBox.cy}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x={viewBox.cx}
          y={viewBox.cy}
          className="fill-foreground text-3xl font-bold"
        >
          {Math.round(clickRate * 100)}%
        </tspan>
        <tspan
          x={viewBox.cx}
          y={viewBox.cy + 22}
          className="fill-muted-foreground text-sm"
        >
          click rate
        </tspan>
      </text>
    );
  };
}

export function AdvertisementStatsSheet({
  open,
  onOpenChange,
  advertisement,
}: Readonly<Props>) {
  const { data, isLoading, isError } = useAdvertisementAnalytics(
    advertisement.id,
    open,
  );

  const deliveryColumns = useMemo(() => makeDeliveryLogColumns(), []);

  const radialChartData = useMemo(() => {
    const totalSent = data?.totalSent ?? advertisement.total_sent;
    const totalClicks = data?.totalClicks ?? advertisement.total_clicks;

    return [
      { name: "clicked", value: totalClicks, fill: "var(--color-clicked)" },
      {
        name: "remaining",
        value: Math.max(totalSent - totalClicks, 0),
        fill: "var(--color-remaining)",
      },
    ];
  }, [advertisement.total_clicks, advertisement.total_sent, data]);

  const clickRate = data?.clickRate ?? 0;
  const timelineData = data?.timeline ?? [];
  const deliveryLogs = data?.deliveryLogs ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-5xl">
        <SheetHeader className="border-b">
          <SheetTitle>Advertisement Stats</SheetTitle>
          <SheetDescription className="space-y-1">
            <span className="block font-medium text-foreground">
              {advertisement.title}
            </span>
            <span className="line-clamp-2 block">
              {advertisement.description || "Analytics overview and delivery history."}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <StatsCard
              title="Sent"
              description="Total deliveries attempted"
              value={data?.totalSent ?? advertisement.total_sent}
              icon={<Send className="size-3.5" />}
              iconClassName="bg-blue-500/10 text-blue-500"
            />
            <StatsCard
              title="Opened"
              description="Messages opened by recipients"
              value={data?.totalOpened ?? advertisement.total_opened}
              icon={<MailOpen className="size-3.5" />}
              iconClassName="bg-emerald-500/10 text-emerald-500"
            />
            <StatsCard
              title="Clicks"
              description="CTA and link interactions"
              value={data?.totalClicks ?? advertisement.total_clicks}
              icon={<MousePointerClick className="size-3.5" />}
              iconClassName="bg-violet-500/10 text-violet-500"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
              <Skeleton className="h-[320px] rounded-2xl" />
              <Skeleton className="h-[320px] rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Frequency</CardTitle>
                  <CardDescription>
                    Distribution activity by day for this advertisement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={timelineChartConfig}
                    className="aspect-auto h-[260px] w-full"
                  >
                    <LineChart
                      accessibilityLayer
                      data={timelineData}
                      margin={{ left: 12, right: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) =>
                              new Date(value).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            }
                          />
                        }
                      />
                      <Line
                        dataKey="sent"
                        type="natural"
                        stroke="var(--color-sent)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-sent)" }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        dataKey="clicked"
                        type="natural"
                        stroke="var(--color-clicked)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-clicked)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Click Gauge</CardTitle>
                  <CardDescription>
                    How much of sent traffic converted into clicks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={radialChartConfig}
                    className="mx-auto aspect-square max-h-[260px]"
                  >
                    <RadialBarChart
                      data={radialChartData}
                      innerRadius={70}
                      outerRadius={110}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        polarRadius={[86, 74]}
                        className="first:fill-muted last:fill-background"
                      />
                      <RadialBar dataKey="value" background cornerRadius={10} />
                      <PolarRadiusAxis
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                      >
                        <Label content={renderRadialLabel(clickRate)} />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="mt-3 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <ChartColumnIncreasing className="size-4" />
                      Sent vs clicks
                    </div>
                    <p className="mt-1">
                      {`${(data?.totalClicks ?? advertisement.total_clicks).toLocaleString()} clicks from ${(data?.totalSent ?? advertisement.total_sent).toLocaleString()} deliveries.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Ad Delivery Log</CardTitle>
              <CardDescription>
                Per-recipient delivery history for this campaign.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  Failed to load advertisement analytics.
                </div>
              ) : (
                <DataTable
                  data={deliveryLogs}
                  columns={deliveryColumns}
                  isLoading={isLoading}
                  getRowId={(row) => row.id}
                  emptyMessage="No delivery logs found for this advertisement."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
