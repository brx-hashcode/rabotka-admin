import { useMemo, useState, type ReactNode } from "react";
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
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Download,
  MailOpen,
  MousePointerClick,
  Send,
} from "lucide-react";
import * as XLSX from "xlsx";

import { DataTable, ProfileCell } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Skeleton } from "#/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";
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
import {
  DELIVERY_STATUS_LABELS,
  MESSAGE_CHANNEL_LABELS,
  labelOf,
} from "#/lib/status-labels";

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

const RABOTKA_PRIMARY_GREEN = "FF22C55E";
const EXCEL_HEADER_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 12 },
  fill: { fgColor: { rgb: RABOTKA_PRIMARY_GREEN } },
  alignment: { horizontal: "center", vertical: "center" },
};

const EXCEL_SECTION_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: RABOTKA_PRIMARY_GREEN } },
  alignment: { horizontal: "left", vertical: "center" },
};

const EXCEL_LABEL_STYLE = {
  font: { bold: true, color: { rgb: "FF111827" } },
  fill: { fgColor: { rgb: "FFF0FDF4" } },
};

function getChannelBadgeClass(channel: string): string {
  switch (channel) {
    case "EMAIL":
      return "bg-sky-500 text-white border-transparent";
    case "WHATSAPP":
      return "bg-green-600 text-white border-transparent";
    case "IN_APP":
      return "bg-amber-500 text-white border-transparent";
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

function slugifyFilename(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function formatIso(value: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toISOString();
  } catch {
    return value;
  }
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function buildCsvRow(values: Array<string | null | undefined>) {
  const normalized = values.map((v) => v ?? "");
  const escaped = normalized.map((s) => {
    const needsQuotes = /[",\n\r]/.test(s);
    const inner = s.replaceAll('"', '""');
    return needsQuotes ? `"${inner}"` : inner;
  });
  return `${escaped.join(",")}\n`;
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
          {labelOf(MESSAGE_CHANNEL_LABELS, row.original.channel)}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={getDeliveryStatusBadgeClass(row.original.status)}>
          {labelOf(DELIVERY_STATUS_LABELS, row.original.status)}
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
      cell: ({ row }) => {
        const reason = row.original.failureReason;
        if (!reason) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        return (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground block max-w-[220px] truncate cursor-help">
                  {reason}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                align="center"
                className="max-w-sm whitespace-normal wrap-break-word text-xs leading-relaxed"
              >
                {reason}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
  ];
}

function RadialLabel({
  viewBox,
  clickRate,
}: Readonly<{
  viewBox?: unknown;
  clickRate: number;
}>) {
  const maybePolar = viewBox as { cx?: unknown; cy?: unknown } | undefined;
  const cx = typeof maybePolar?.cx === "number" ? maybePolar.cx : null;
  const cy = typeof maybePolar?.cy === "number" ? maybePolar.cy : null;

  if (cx == null || cy == null) {
    return null;
  }

  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} y={cy} className="fill-foreground text-3xl font-bold">
        {Math.round(clickRate * 100)}%
      </tspan>
      <tspan x={cx} y={cy + 22} className="fill-muted-foreground text-sm">
        click rate
      </tspan>
    </text>
  );
}

const LOG_PAGE_SIZE_OPTIONS = [10, 20, 50];

function DeliveryLogPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Readonly<{
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Rows per page</span>
          <select
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {LOG_PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium tabular-nums whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(1)} disabled={page <= 1}>
            <ChevronFirst className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>
            <ChevronLast className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
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
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);

  const radialChartData = useMemo(() => {
    const totalSent = data?.totalSent ?? advertisement.total_sent;
    const totalClicks = data?.totalClicks ?? advertisement.total_clicks;
    const clicked = Math.min(totalClicks, totalSent);
    const remaining =
      totalSent > 0 ? Math.max(totalSent - clicked, 0) : 1;

    // One row + stacked RadialBars so arc = clicked / (clicked + remaining).
    // Multiple rows without stacking each get their own ring scaled by max(value),
    // which makes the "clicked" ring always look 100% when it equals max.
    return [{ clicked, remaining }];
  }, [advertisement.total_clicks, advertisement.total_sent, data]);

  const clickRate = data?.clickRate ?? 0;
  const timelineData = data?.timeline ?? [];
  const deliveryLogs = data?.deliveryLogs ?? [];

  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * logPageSize;
    return deliveryLogs.slice(start, start + logPageSize);
  }, [deliveryLogs, logPage, logPageSize]);

  const exportDisabled = isLoading || isError || !data;
  const fileBase = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const slug = slugifyFilename(advertisement.title || "advertisement");
    return `ad-report-${slug}-${today}`;
  }, [advertisement.title]);

  const handleDownloadCsv = () => {
    if (!data) return;

    const summaryLines = [
      buildCsvRow(["Summary", "Value"]),
      buildCsvRow(["AdvertisementTitle", advertisement.title]),
      buildCsvRow(["TotalSent", String(data.totalSent)]),
      buildCsvRow(["TotalOpened", String(data.totalOpened)]),
      buildCsvRow(["TotalClicks", String(data.totalClicks)]),
      buildCsvRow([
        "ClickRatePercent",
        String(Math.round(data.clickRate * 100)),
      ]),
      "\n",
    ].join("");

    const header = buildCsvRow([
      "ProfileName",
      "ProfileEmail",
      "Channel",
      "Status",
      "SentAt",
      "OpenedAt",
      "ClickedAt",
      "FailureReason",
    ]);

    const rows = data.deliveryLogs
      .map((row) =>
        buildCsvRow([
          row.profileName,
          row.profileEmail,
          row.channel,
          row.status,
          formatIso(row.sentAt),
          formatIso(row.openedAt),
          formatIso(row.clickedAt),
          row.failureReason ?? "",
        ]),
      )
      .join("");

    downloadTextFile(`${fileBase}.csv`, `${summaryLines}${header}${rows}`);
  };

  const handleDownloadXlsx = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    const summaryAoa = [
      ["Rabotka Advertisement Report", ""],
      ["Field", "Value"],
      ["Advertisement Title", advertisement.title],
      ["Total Sent", data.totalSent],
      ["Total Opened", data.totalOpened],
      ["Total Clicks", data.totalClicks],
      ["Click Rate Percent", Math.round(data.clickRate * 100)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
    summaryWs["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    summaryWs["!cols"] = [{ wch: 28 }, { wch: 44 }];
    summaryWs["!rows"] = [{ hpt: 26 }, { hpt: 22 }];
    summaryWs.A1.s = EXCEL_HEADER_STYLE;
    if (summaryWs.B1) summaryWs.B1.s = EXCEL_HEADER_STYLE;
    summaryWs.A2.s = EXCEL_SECTION_STYLE;
    summaryWs.B2.s = EXCEL_SECTION_STYLE;
    for (const cell of ["A3", "A4", "A5", "A6", "A7"]) {
      if (summaryWs[cell]) {
        summaryWs[cell].s = EXCEL_LABEL_STYLE;
      }
    }
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    const logsJson = data.deliveryLogs.map((row) => ({
      ProfileName: row.profileName,
      ProfileEmail: row.profileEmail,
      Channel: row.channel,
      Status: row.status,
      SentAt: formatIso(row.sentAt),
      OpenedAt: formatIso(row.openedAt),
      ClickedAt: formatIso(row.clickedAt),
      FailureReason: row.failureReason ?? "",
    }));
    const logsWs = XLSX.utils.json_to_sheet(logsJson);
    logsWs["!cols"] = [
      { wch: 26 },
      { wch: 32 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
      { wch: 40 },
    ];
    logsWs["!autofilter"] = {
      ref: `A1:H${Math.max(logsJson.length + 1, 2)}`,
    };
    logsWs["!rows"] = [{ hpt: 22 }];
    for (const cell of ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"]) {
      if (logsWs[cell]) {
        logsWs[cell].s = EXCEL_SECTION_STYLE;
      }
    }
    XLSX.utils.book_append_sheet(wb, logsWs, "DeliveryLogs");

    XLSX.writeFile(wb, `${fileBase}.xlsx`, {
      compression: true,
      cellStyles: true,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-5xl flex flex-col overflow-hidden">
        <SheetHeader className="border-b shrink-0">
          <SheetTitle>Advertisement Stats</SheetTitle>
          <SheetDescription className="flex items-center justify-between mt-0">
            <h2 className="text-2xl font-semibold text-primary">
              {advertisement.title}
            </h2>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  disabled={exportDisabled}
                  title={
                    exportDisabled ? "Export is unavailable" : "Export report"
                  }
                >
                  <Download className="size-4" />
                  <span>
                    {exportDisabled ? "Export is unavailable" : "Export report"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={handleDownloadCsv}>
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDownloadXlsx}>
                  Download Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
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
              <Card className="rounded-lg">
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

              <Card className="rounded-lg">
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
                      <RadialBar
                        dataKey="clicked"
                        stackId="gauge"
                        fill="var(--color-clicked)"
                        cornerRadius={10}
                      />
                      <RadialBar
                        dataKey="remaining"
                        stackId="gauge"
                        fill="var(--color-remaining)"
                        cornerRadius={10}
                      />
                      <PolarRadiusAxis
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                      >
                        <Label
                          content={<RadialLabel clickRate={clickRate} />}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <section className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold leading-none">
                Ad Delivery Log
              </h3>
              <p className="text-sm text-muted-foreground">
                Per-recipient delivery history for this campaign.
              </p>
            </div>
            {isError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                Failed to load advertisement analytics.
              </div>
            ) : (
              <DataTable
                data={paginatedLogs}
                columns={deliveryColumns}
                isLoading={isLoading}
                getRowId={(row) => row.id}
                emptyMessage="No delivery logs found for this advertisement."
                footer={
                  <DeliveryLogPagination
                    total={deliveryLogs.length}
                    page={logPage}
                    pageSize={logPageSize}
                    onPageChange={(p) => setLogPage(p)}
                    onPageSizeChange={(s) => {
                      setLogPageSize(s);
                      setLogPage(1);
                    }}
                  />
                }
              />
            )}
          </section>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
