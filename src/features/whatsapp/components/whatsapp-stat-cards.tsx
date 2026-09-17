import {
  DashboardMetricsCards,
  type DashboardMetricCard,
} from "#/features/dashboard/components/dashboard-metrics-cards";
import type { WhatsappStats } from "#/lib/api/whatsapp-controller";

/**
 * The four numbers that answer "are our messages arriving?".
 *
 * Rates lead and counts follow, because a raw count cannot be judged without
 * knowing the denominator — 40 failures is fine out of 40,000 and a crisis out
 * of 60. Sent is the exception: it IS the denominator, so its count is the
 * headline.
 *
 * Every rate is measured against SENT rather than against all rows. A message
 * still QUEUED has not failed to be delivered, it has not been sent yet, and
 * counting it would make a healthy backlog read as a delivery problem.
 */

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "no delivery data yet";
  if (seconds < 60) return `median ${seconds}s to deliver`;
  return `median ${Math.round(seconds / 60)}m to deliver`;
}

export function WhatsappStatCards({
  stats,
  isLoading,
}: Readonly<{ stats: WhatsappStats | undefined; isLoading: boolean }>) {
  const cards: DashboardMetricCard[] = stats
    ? [
        {
          id: "sent",
          title: "Sent",
          value: stats.sent.toLocaleString(),
          trend: null,
          trendPercentage: null,
          // Received messages ride along here rather than on a fifth card:
          // the grid is four wide, and they are volume, not a delivery rate.
          description: [
            stats.totals.QUEUED > 0
              ? `${stats.totals.QUEUED.toLocaleString()} still being prepared`
              : "accepted by WhatsApp",
            `${stats.received.toLocaleString()} received`,
          ].join(" · "),
        },
        {
          id: "delivered",
          title: "Delivered",
          value: `${stats.deliveryRate}%`,
          trend: null,
          trendPercentage: null,
          description: `${(
            stats.totals.DELIVERED + stats.totals.READ
          ).toLocaleString()} reached the handset · ${formatDuration(
            stats.medianDeliverySeconds,
          )}`,
        },
        {
          id: "read",
          title: "Read",
          value: `${stats.readRate}%`,
          trend: null,
          trendPercentage: null,
          description: `${stats.totals.READ.toLocaleString()} opened by the recipient`,
        },
        {
          id: "failed",
          title: "Failed",
          value: `${stats.failureRate}%`,
          trend: null,
          trendPercentage: null,
          description: `${stats.totals.FAILED.toLocaleString()} never left, of ${stats.total.toLocaleString()} total`,
        },
      ]
    : [];

  return <DashboardMetricsCards data={cards} isLoading={isLoading} />;
}
