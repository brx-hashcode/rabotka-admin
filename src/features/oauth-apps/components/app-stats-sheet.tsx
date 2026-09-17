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
  BadgeCheck,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Download,
  LogIn,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";

import { DataTable } from "#/components/table";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import { Skeleton } from "#/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import {
  useOAuthAppRequests,
  useOAuthAppStats,
} from "#/hooks/use-oauth-app-activity";
import type {
  OAuthApp,
  OAuthAppRequest,
  OAuthAppStats,
  PartnerApiCallKind,
} from "#/lib/api/oauth-apps-controller";
import {
  CALL_KIND_OPTIONS,
  callLabel,
  describeRequest,
  formatDuration,
  outcomeLabel,
} from "../activity-labels";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: OAuthApp;
};

const ALL_CALLS = "all";
const PAGE_SIZES = [10, 20, 50];

const timelineConfig = {
  signIns: { label: "Sign-ins", color: "var(--chart-1)" },
  identityChecks: { label: "Identity checks", color: "var(--chart-2)" },
} satisfies ChartConfig;

const gaugeConfig = {
  approved: { label: "Approved", color: "var(--chart-2)" },
  other: { label: "Not approved", color: "var(--muted)" },
} satisfies ChartConfig;

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function StatCard({
  title,
  value,
  description,
  icon,
  iconClassName,
}: Readonly<{
  title: string;
  value: number | null;
  description: string;
  icon: ReactNode;
  iconClassName: string;
}>) {
  return (
    <div className="bg-card shadow-soft rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium">{title}</p>
        <span
          className={`inline-flex size-7 shrink-0 items-center justify-center rounded-md ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
      {value === null ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {value.toLocaleString()}
        </p>
      )}
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
    </div>
  );
}

function makeColumns(): ColumnDef<OAuthAppRequest>[] {
  return [
    {
      id: "when",
      header: "When",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "call",
      header: "Call",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {callLabel(row.original.kind)}
        </span>
      ),
    },
    {
      id: "result",
      header: "Result",
      cell: ({ row }) => {
        const ok = row.original.outcome === "ok";
        return (
          <Badge
            title={`${row.original.statusCode} ${row.original.outcome}`}
            className={
              ok
                ? "border-transparent bg-emerald-500 text-white"
                : "border-transparent bg-rose-600 text-white"
            }
          >
            {outcomeLabel(row.original.outcome)}
          </Badge>
        );
      },
    },
    {
      id: "duration",
      header: "Time taken",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatDuration(row.original.durationMs)}
        </span>
      ),
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => {
        const text = describeRequest(row.original);
        return (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground block max-w-[320px] cursor-help truncate text-sm">
                  {text}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="max-w-md text-xs leading-relaxed whitespace-pre-wrap"
              >
                {`What the partner sent:\n${JSON.stringify(row.original.request, null, 2)}\n\nWhat Rabotka answered (${row.original.statusCode}):\n${JSON.stringify(row.original.response, null, 2)}`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
  ];
}

function Pagination({
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
      <p className="text-muted-foreground text-sm tabular-nums">
        {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium whitespace-nowrap tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="First page"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
          >
            <ChevronFirst className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Last page"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
          >
            <ChevronLast className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function GaugeLabel({
  viewBox,
  share,
}: Readonly<{ viewBox?: unknown; share: number | null }>) {
  const polar = viewBox as { cx?: unknown; cy?: unknown } | undefined;
  if (typeof polar?.cx !== "number" || typeof polar?.cy !== "number") {
    return null;
  }
  const { cx, cy } = polar;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} y={cy} className="fill-foreground text-3xl font-bold">
        {share === null ? "—" : `${Math.round(share * 100)}%`}
      </tspan>
      <tspan x={cx} y={cy + 22} className="fill-muted-foreground text-sm">
        approved
      </tspan>
    </text>
  );
}

export function AppStatsSheet({ open, onOpenChange, app }: Readonly<Props>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [kind, setKind] = useState<PartnerApiCallKind | undefined>();

  const stats = useOAuthAppStats(app.id, open);
  const requests = useOAuthAppRequests(
    app.id,
    { page, limit: pageSize, kind },
    open,
  );
  const columns = useMemo(() => makeColumns(), []);

  const data = stats.data;
  const finished = data
    ? data.identityChecks.completed + data.identityChecks.notCompleted
    : 0;
  const approvedShare =
    data && finished > 0 ? data.identityChecks.completed / finished : null;
  const gaugeData = [
    {
      approved: data?.identityChecks.completed ?? 0,
      // An empty gauge still needs something to draw.
      other: finished > 0 ? (data?.identityChecks.notCompleted ?? 0) : 1,
    },
  ];

  const rows = requests.data?.data ?? [];
  const exportDisabled = !data || requests.isLoading;
  const fileBase = `partner-activity-${slug(app.name)}-${new Date()
    .toISOString()
    .slice(0, 10)}`;

  function exportCsv() {
    if (!data) return;
    download(`${fileBase}.csv`, toCsv(app, data, rows));
  }

  function exportXlsx() {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Figure", "Value"], ...summaryRows(app, data)]),
      "Summary",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(rows.map(requestRow)),
      "Requests",
    );
    XLSX.writeFile(wb, `${fileBase}.xlsx`, { compression: true });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-5xl">
        <SheetHeader className="shrink-0">
          <SheetTitle>Partner app activity</SheetTitle>
          <SheetDescription className="mt-0 flex items-center justify-between gap-4">
            <span className="text-primary text-2xl font-semibold">
              {app.name}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" disabled={exportDisabled}>
                  <Download className="size-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={exportCsv}>
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={exportXlsx}>
                  Download Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4">
            {stats.isError && (
              <p className="text-destructive bg-destructive/5 rounded-lg p-4 text-sm">
                Couldn't load this app's figures. Close the drawer and try
                again.
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Sign-ins"
                value={data?.signIns ?? null}
                description="Completed with Login with Rabotka"
                icon={<LogIn className="size-3.5" />}
                iconClassName="bg-blue-500/10 text-blue-500"
              />
              <StatCard
                title="Identity checks"
                value={data?.identityChecks.total ?? null}
                description={
                  data
                    ? `${data.identityChecks.completed} completed · ${data.identityChecks.notCompleted} not completed · ${data.identityChecks.pending} waiting`
                    : "Requested by this app"
                }
                icon={<ShieldCheck className="size-3.5" />}
                iconClassName="bg-violet-500/10 text-violet-500"
              />
              <StatCard
                title="People signed in"
                value={data?.connectedPeople ?? null}
                description="Currently connected to this app"
                icon={<Users className="size-3.5" />}
                iconClassName="bg-amber-500/10 text-amber-600"
              />
              <StatCard
                title="Verified people signed in"
                value={data?.verifiedConnected ?? null}
                description="Of those, identity verified by our team"
                icon={<UserCheck className="size-3.5" />}
                iconClassName="bg-emerald-500/10 text-emerald-600"
              />
              <StatCard
                title="Identity checks verified"
                value={data?.verifiedByCheck ?? null}
                description="Approved by a person whose identity is verified"
                icon={<BadgeCheck className="size-3.5" />}
                iconClassName="bg-teal-500/10 text-teal-600"
              />
            </div>

            {stats.isLoading ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
                <Skeleton className="h-[320px] rounded-lg" />
                <Skeleton className="h-[320px] rounded-lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
                <section className="bg-card shadow-soft space-y-3 rounded-lg p-4">
                  <div>
                    <h3 className="font-semibold">Activity (last 30 days)</h3>
                    <p className="text-muted-foreground text-sm">
                      Sign-ins and identity checks per day.
                    </p>
                  </div>
                  <ChartContainer
                    config={timelineConfig}
                    className="aspect-auto h-[260px] w-full"
                  >
                    <LineChart
                      accessibilityLayer
                      data={data?.timeline ?? []}
                      margin={{ left: 12, right: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value: string) =>
                          new Date(value).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Line
                        dataKey="signIns"
                        type="monotone"
                        stroke="var(--color-signIns)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        dataKey="identityChecks"
                        type="monotone"
                        stroke="var(--color-identityChecks)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </section>

                <section className="bg-card shadow-soft space-y-3 rounded-lg p-4">
                  <div>
                    <h3 className="font-semibold">Identity check answers</h3>
                    <p className="text-muted-foreground text-sm">
                      Share of finished checks the person approved.
                    </p>
                  </div>
                  <ChartContainer
                    config={gaugeConfig}
                    className="mx-auto aspect-square max-h-[240px]"
                  >
                    <RadialBarChart
                      data={gaugeData}
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
                        dataKey="approved"
                        stackId="gauge"
                        fill="var(--color-approved)"
                        cornerRadius={10}
                      />
                      <RadialBar
                        dataKey="other"
                        stackId="gauge"
                        fill="var(--color-other)"
                        cornerRadius={10}
                      />
                      <PolarRadiusAxis
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                      >
                        <Label content={<GaugeLabel share={approvedShare} />} />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </ChartContainer>
                </section>
              </div>
            )}

            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    Requests from the partner's server
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    What the partner asked for and what Rabotka answered,
                    newest first. Kept for 90 days. Hover a line for the
                    details.
                  </p>
                </div>
                <Select
                  value={kind ?? ALL_CALLS}
                  onValueChange={(value) => {
                    setKind(
                      value === ALL_CALLS
                        ? undefined
                        : (value as PartnerApiCallKind),
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CALLS}>All calls</SelectItem>
                    {CALL_KIND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requests.isError ? (
                <p className="text-destructive bg-destructive/5 rounded-lg p-4 text-sm">
                  Couldn't load the requests. Close the drawer and try again.
                </p>
              ) : (
                <DataTable
                  data={rows}
                  columns={columns}
                  isLoading={requests.isLoading}
                  getRowId={(row) => row.id}
                  emptyMessage="No requests from this app yet."
                  footer={
                    <Pagination
                      total={requests.data?.total ?? 0}
                      page={page}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
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

function summaryRows(app: OAuthApp, data: OAuthAppStats): (string | number)[][] {
  return [
    ["Partner app", app.name],
    ["Sign-ins", data.signIns],
    ["Identity checks", data.identityChecks.total],
    ["Identity checks completed", data.identityChecks.completed],
    ["Identity checks not completed", data.identityChecks.notCompleted],
    ["Identity checks waiting", data.identityChecks.pending],
    ["People signed in", data.connectedPeople],
    ["Verified people signed in", data.verifiedConnected],
    ["Identity checks verified", data.verifiedByCheck],
  ];
}

function requestRow(row: OAuthAppRequest) {
  return {
    When: row.createdAt,
    Call: callLabel(row.kind),
    Result: outcomeLabel(row.outcome),
    "Status code": row.statusCode,
    "Time taken (ms)": row.durationMs,
    Details: describeRequest(row),
  };
}

function toCsv(
  app: OAuthApp,
  data: OAuthAppStats,
  rows: OAuthAppRequest[],
): string {
  const line = (values: (string | number)[]) =>
    `${values
      .map((value) => {
        const text = String(value);
        return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
      })
      .join(",")}\n`;

  const summary = [line(["Figure", "Value"]), ...summaryRows(app, data).map(line)];
  const header = line(Object.keys(requestRow(rows[0] ?? emptyRow())));
  const body = rows.map((row) => line(Object.values(requestRow(row))));
  return [...summary, "\n", header, ...body].join("");
}

function emptyRow(): OAuthAppRequest {
  return {
    id: "",
    kind: "TOKEN",
    statusCode: 0,
    outcome: "ok",
    durationMs: 0,
    request: {},
    response: {},
    createdAt: "",
  };
}

function download(filename: string, contents: string) {
  const url = URL.createObjectURL(
    new Blob([contents], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)+/g, "")
    .slice(0, 60);
}
