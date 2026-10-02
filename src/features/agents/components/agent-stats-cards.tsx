import {
  IconActivity,
  IconMapPin,
  IconUsersGroup,
  IconWallet,
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useAgentStats } from "#/hooks/use-agents";
import { formatFcfa } from "../agent-rules";

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
        {isLoading ? <Skeleton className="h-8 w-24" /> : children}
      </CardContent>
    </Card>
  );
}

const pct = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

/**
 * The four questions an admin opens this page with: how many agents can work
 * right now, are they actually using the app, are the jobs where the agents
 * are, and what does Rabotka owe them.
 */
export function AgentStatsCards() {
  const { data, isLoading } = useAgentStats();
  const coverage = data?.coverage;
  const coveredPct = pct(coverage?.coveredJobs ?? 0, coverage?.openJobs ?? 0);
  const active = data?.agents.active ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Active agents" icon={IconUsersGroup} isLoading={isLoading}>
        <p className="text-2xl font-bold tabular-nums">{active}</p>
        <p className="text-muted-foreground text-xs">
          {data?.agents.suspended ?? 0} suspended ·{" "}
          {data?.agents.revoked ?? 0} revoked
        </p>
      </StatCard>

      {/* Signed-in-this-week is the honest measure of a field force: an agent
          who never opens the app is a name on a list, not coverage. */}
      <StatCard title="Active this week" icon={IconActivity} isLoading={isLoading}>
        <p className="text-2xl font-bold tabular-nums">
          {data?.engagement.signedInLast7Days ?? 0}
          <span className="text-muted-foreground text-base font-medium">
            {" "}
            / {active}
          </span>
        </p>
        <p className="text-muted-foreground text-xs">
          {data?.engagement.neverSignedIn
            ? `${data.engagement.neverSignedIn} never signed in`
            : "signed in to the agent app in 7 days"}
        </p>
      </StatCard>

      {/* Coverage is the number to act on: an uncovered city with open jobs is
          where the next agent should be recruited. */}
      <StatCard title="Job coverage" icon={IconMapPin} isLoading={isLoading}>
        <p className="text-2xl font-bold tabular-nums">
          {coveredPct}%
          <span className="text-muted-foreground text-base font-medium">
            {" "}
            of {coverage?.openJobs ?? 0} open jobs
          </span>
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {coverage?.topUncovered
            ? `Most uncovered: ${coverage.topUncovered.city} (${coverage.topUncovered.openJobs} jobs)`
            : `${coverage?.citiesCovered ?? 0} cities covered`}
        </p>
      </StatCard>

      {data?.money ? (
        <StatCard title="Owed to agents" icon={IconWallet} isLoading={isLoading}>
          <p className="text-2xl font-bold tabular-nums">
            {formatFcfa(data.money.owed)}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatFcfa(data.money.available)} withdrawable ·{" "}
            {formatFcfa(data.money.paidOut)} paid out
          </p>
        </StatCard>
      ) : (
        <StatCard title="Cities covered" icon={IconMapPin} isLoading={isLoading}>
          <p className="text-2xl font-bold tabular-nums">
            {coverage?.citiesCovered ?? 0}
          </p>
          <p className="text-muted-foreground text-xs">
            by at least one active agent
          </p>
        </StatCard>
      )}
    </div>
  );
}
