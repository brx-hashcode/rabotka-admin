import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { IconInfoCircle } from "@tabler/icons-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Skeleton } from "#/components/ui/skeleton";
import type {
  WhatsappBilling,
  WhatsappBusinessBilling,
} from "#/lib/api/whatsapp-controller";
import {
  useWhatsappBilling,
  useWhatsappRange,
} from "#/hooks/use-whatsapp-analytics";
import { WhatsappCategoryBadge } from "./whatsapp-status-badge";

/**
 * Two different numbers, kept visibly apart.
 *
 * CONSUMED is what we used in the selected window, from `pricing_analytics`.
 * OUTSTANDING is what Meta has not yet been paid, from the business node. They
 * are not comparable, and putting one big currency figure on this page without
 * saying which it is invites the obvious mistake: reading a 30-day usage total
 * as the amount owed, which overstates the bill by everything already charged.
 *
 * So the window is always in the card's label, never implied.
 *
 * The outstanding half needs `business_management` on the access token. When
 * it is missing the panel says which scope to grant rather than rendering an
 * empty card that reads as "you owe nothing".
 *
 * Cost is withheld entirely for partner-billed accounts, which is why an
 * absent cost renders as "not reported" rather than as zero. Charting a real
 * volume as free would be a lie the reader has no way to detect.
 */

const chartConfig = {
  cost: { label: "Cost", color: "#f59e0b" },
  volume: { label: "Messages", color: "#3b82f6" },
} satisfies ChartConfig;

type DayPoint = { date: string; cost: number; volume: number };

/** Meta returns one row per (day × category × country); the chart wants days. */
function rollUpByDay(pricing: WhatsappBilling["pricing"]): DayPoint[] {
  const byDay = new Map<string, DayPoint>();
  for (const point of pricing) {
    const date = new Date(point.start * 1000).toISOString().slice(0, 10);
    const entry = byDay.get(date) ?? { date, cost: 0, volume: 0 };
    entry.cost += point.cost ?? 0;
    entry.volume += point.volume;
    byDay.set(date, entry);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

type CategoryRow = {
  category: string;
  volume: number;
  cost: number;
  /** False when Meta reported volume for this category but withheld cost. */
  hasCost: boolean;
};

function rollUpByCategory(pricing: WhatsappBilling["pricing"]): CategoryRow[] {
  const byCategory = new Map<string, CategoryRow>();
  for (const point of pricing) {
    const category = point.pricing_category ?? "UNKNOWN";
    const entry = byCategory.get(category) ?? {
      category,
      volume: 0,
      cost: 0,
      hasCost: false,
    };
    entry.volume += point.volume;
    if (point.cost !== undefined) {
      entry.cost += point.cost;
      entry.hasCost = true;
    }
    byCategory.set(category, entry);
  }
  return [...byCategory.values()].sort((a, b) => b.volume - a.volume);
}

function formatMoney(value: number, currency: string | null): string {
  if (!currency) return value.toFixed(2);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function Notice({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-md p-3 text-sm">
      <IconInfoCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

/**
 * What is currently owed, from the business node.
 *
 * Three genuinely different states, and collapsing any two of them would
 * mislead: we cannot read it (missing scope), we read it and there is no
 * credit line (a card-billed account — Meta reports the balance in Business
 * Manager only), or we have a figure.
 */
function OutstandingCard({
  billing,
}: Readonly<{ billing: WhatsappBusinessBilling | undefined }>) {
  if (billing?.permissionMissing) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Outstanding balance</CardDescription>
          <CardTitle className="text-muted-foreground text-2xl font-bold">
            permission needed
          </CardTitle>
          <p className="text-muted-foreground pt-1 text-xs">
            The balance and invoice endpoints exist but the access token does
            not carry the{" "}
            <code className="font-mono">{billing.permissionMissing}</code>{" "}
            scope. Grant it to the system user in Business Settings and this
            fills in — no code change needed.
          </p>
        </CardHeader>
      </Card>
    );
  }

  const line = billing?.creditLines?.[0];

  if (!line) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Outstanding balance</CardDescription>
          <CardTitle className="text-muted-foreground text-2xl font-bold">
            not on a credit line
          </CardTitle>
          <p className="text-muted-foreground pt-1 text-xs">
            This account pays by card, so Meta charges it automatically and
            reports no credit-line balance through the API. The live figure is
            in Business Manager → Billing &amp; payments.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Outstanding balance</CardDescription>
        <CardTitle className="text-4xl font-bold tabular-nums">
          {line.balance
            ? formatMoney(Number(line.balance), line.currency)
            : "—"}
        </CardTitle>
        <p className="text-muted-foreground pt-1 text-xs">
          {line.creditAvailable
            ? `${formatMoney(Number(line.creditAvailable), line.currency)} still available`
            : "Accrued and not yet charged."}
        </p>
      </CardHeader>
    </Card>
  );
}

/** Invoices, when the account has any and the token can read them. */
function InvoicesCard({
  billing,
}: Readonly<{ billing: WhatsappBusinessBilling }>) {
  if (billing.permissionMissing) return null;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>
          Issued by Meta for this business. Card-billed accounts are charged
          automatically and may have none here — the receipts live in Business
          Manager instead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billing.invoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    No invoices issued for this business.
                  </TableCell>
                </TableRow>
              ) : (
                billing.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="text-sm">
                      {invoice.billingPeriod ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {invoice.invoiceDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {invoice.dueDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {invoice.paymentStatus ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {invoice.amountDue
                        ? formatMoney(
                            Number(invoice.amountDue),
                            invoice.currency,
                          )
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhatsappBillingPanel({
  enabled = true,
}: Readonly<{ enabled?: boolean }>) {
  const { data, isLoading, isError, error } = useWhatsappBilling(enabled);
  const range = useWhatsappRange();

  // The window goes IN the label. Without it a currency figure on a dashboard
  // reads as a standing balance, which is the misreading this panel exists to
  // prevent.
  const windowLabel =
    range.created_from || range.created_to
      ? `${range.created_from || "start"} → ${range.created_to || "today"}`
      : "last 30 days";

  const days = useMemo(() => rollUpByDay(data?.pricing ?? []), [data]);
  const categories = useMemo(
    () => rollUpByCategory(data?.pricing ?? []),
    [data],
  );

  const totalCost = days.reduce((sum, day) => sum + day.cost, 0);
  const totalVolume = days.reduce((sum, day) => sum + day.volume, 0);
  const costReported = categories.some((row) => row.hasCost);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consumption unavailable</CardTitle>
          <CardDescription>
            {error instanceof Error
              ? error.message
              : "Could not reach the WhatsApp Business Account."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data?.costUnavailableReason ? (
        <Notice>{data.costUnavailableReason}</Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Consumed · {windowLabel}</CardDescription>
            <CardTitle className="text-4xl font-bold tabular-nums">
              {costReported
                ? formatMoney(totalCost, data?.currency ?? null)
                : "not reported"}
            </CardTitle>
            <p className="text-muted-foreground pt-1 text-xs">
              What we used in this window. Most of it has already been charged —
              this is not what is owed.
            </p>
          </CardHeader>
        </Card>

        <OutstandingCard billing={data?.billing} />

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Billable messages · {windowLabel}</CardDescription>
            <CardTitle className="text-4xl font-bold tabular-nums">
              {totalVolume.toLocaleString()}
            </CardTitle>
            <p className="text-muted-foreground pt-1 text-xs">
              Messages Meta counted as chargeable.
            </p>
          </CardHeader>
        </Card>
      </div>

      {data?.billing ? <InvoicesCard billing={data.billing} /> : null}

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Daily volume</CardTitle>
          <CardDescription>
            Messages Meta counted as billable, per day.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <BarChart data={days} margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="volume" fill="var(--color-volume)" radius={2} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardTitle>By pricing category</CardTitle>
          <CardDescription>
            Meta prices authentication, utility and marketing messages
            differently — this is where the money actually goes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      Meta reported no billable traffic in this window.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell>
                        <WhatsappCategoryBadge category={row.category} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.volume.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.hasCost ? (
                          formatMoney(row.cost, data?.currency ?? null)
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            not reported
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
