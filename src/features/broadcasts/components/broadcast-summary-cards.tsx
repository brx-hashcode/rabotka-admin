import { useQuery } from "@tanstack/react-query";
import { BellRing, CircleAlert, MailCheck, Megaphone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { getBroadcastsSummary } from "#/lib/api/broadcasts-controller";

const nf = (n: number) => n.toLocaleString("fr-FR");
const pct = (part: number, whole: number) =>
  whole === 0 ? null : Math.round((part / whole) * 100);

function StatCard({
  title,
  icon: Icon,
  isLoading,
  children,
}: Readonly<{
  title: string;
  icon: React.ElementType;
  isLoading: boolean;
  children: React.ReactNode;
}>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/**
 * What broadcasting has done so far: how many went out, how many messages
 * reached someone, how many did not, and whether the in-app ones were read.
 */
export function BroadcastSummaryCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "broadcasts", "summary"],
    queryFn: getBroadcastsSummary,
    // Counters move on their own while a broadcast is going out.
    refetchInterval: (q) => {
      const s = q.state.data?.byStatus;
      return s && (s.SENDING > 0 || s.SCHEDULED > 0) ? 15_000 : false;
    },
  });

  const s = data?.byStatus;
  const sent = (s?.SENT ?? 0) + (s?.FAILED ?? 0);
  const deliveredPct = pct(data?.delivered ?? 0, data?.recipients ?? 0);
  const failedPct = pct(data?.failed ?? 0, data?.recipients ?? 0);
  const readPct = pct(data?.read ?? 0, data?.inAppDelivered ?? 0);
  const last = data?.lastSentAt
    ? new Date(data.lastSentAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Broadcasts sent" icon={Megaphone} isLoading={isLoading}>
        <p className="text-2xl font-bold tabular-nums">{nf(sent)}</p>
        <p className="text-muted-foreground text-xs">
          {[
            s?.SENDING ? `${s.SENDING} sending` : null,
            s?.SCHEDULED ? `${s.SCHEDULED} scheduled` : null,
            s?.DRAFT ? `${s.DRAFT} draft${s.DRAFT > 1 ? "s" : ""}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || (last ? `Last one on ${last}` : "None yet")}
        </p>
      </StatCard>

      <StatCard title="Messages delivered" icon={MailCheck} isLoading={isLoading}>
        <p className="text-2xl font-bold tabular-nums">
          {nf(data?.delivered ?? 0)}
          <span className="text-muted-foreground text-base font-medium">
            {" "}
            / {nf(data?.recipients ?? 0)}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">
          {deliveredPct === null
            ? "Across every channel"
            : `${deliveredPct} % delivered, across every channel`}
        </p>
      </StatCard>

      <StatCard title="Failed" icon={CircleAlert} isLoading={isLoading}>
        <p
          className={
            (data?.failed ?? 0) > 0
              ? "text-2xl font-bold tabular-nums text-destructive"
              : "text-2xl font-bold tabular-nums"
          }
        >
          {nf(data?.failed ?? 0)}
        </p>
        <p className="text-muted-foreground text-xs">
          {(data?.failed ?? 0) === 0
            ? "Every message got through"
            : `${failedPct} % of messages · open a broadcast for the reasons`}
        </p>
      </StatCard>

      <StatCard title="In-app read rate" icon={BellRing} isLoading={isLoading}>
        <p className="text-2xl font-bold tabular-nums">
          {readPct === null ? "—" : `${readPct} %`}
        </p>
        <p className="text-muted-foreground text-xs">
          {nf(data?.read ?? 0)} read of {nf(data?.inAppDelivered ?? 0)} in-app
          notifications
        </p>
      </StatCard>
    </div>
  );
}
