import {
  IconCalendarCheck,
  IconCash,
  IconClockHour4,
} from "@tabler/icons-react";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import {
  canProcessAgentWithdrawal,
  formatFcfa,
  isOverdueWithdrawal,
  operatorBadgeClass,
  waitedFor,
} from "#/features/agents/agent-rules";
import { AgentWithdrawalsList } from "#/features/agents/components/agent-withdrawals-list";
import { PayoutsChart } from "#/features/agents/components/payouts-chart";
import { useAgentWithdrawals } from "#/hooks/use-agents";
import { useRole } from "#/hooks/use-role";

function Figure({
  title,
  icon: Icon,
  value,
  isLoading,
  children,
}: Readonly<{
  title: string;
  icon: React.ElementType;
  value: string;
  isLoading: boolean;
  children?: React.ReactNode;
}>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent className="space-y-1.5">
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        )}
        <div className="text-muted-foreground text-xs">{children}</div>
      </CardContent>
    </Card>
  );
}

/**
 * Where agents get paid. The figures say what to do today — how many are
 * waiting and since when, how much to send on each network — and the table
 * is the queue, oldest first.
 */
export default function AgentPayoutsPage() {
  const { role } = useRole();
  // Same query as the table's default "To pay" view — served from cache.
  const queue = useAgentWithdrawals({ status: "REQUESTED", page: 1 });
  const summary = queue.data?.summary;
  const open = summary?.open;
  const oldestOverdue = open?.oldestAt ? isOverdueWithdrawal(open.oldestAt) : false;

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Figure
          title="Requests to pay"
          icon={IconClockHour4}
          value={String(open?.count ?? 0)}
          isLoading={queue.isLoading}
        >
          {open?.oldestAt ? (
            <span
              className={
                oldestOverdue ? "font-medium text-amber-600 dark:text-amber-400" : ""
              }
            >
              Oldest waiting {waitedFor(open.oldestAt)}
            </span>
          ) : (
            "No agent is waiting"
          )}
        </Figure>

        <Figure
          title="Amount to send"
          icon={IconCash}
          value={formatFcfa(open?.amount ?? 0)}
          isLoading={queue.isLoading}
        >
          {open && open.count > 0 ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {(["MTN", "AIRTEL"] as const)
                .filter((op) => open.byOperator[op].count > 0)
                .map((op) => (
                  <Badge key={op} className={operatorBadgeClass(op)}>
                    {op === "MTN" ? "MTN" : "Airtel"}{" "}
                    {formatFcfa(open.byOperator[op].amount)}
                  </Badge>
                ))}
            </span>
          ) : (
            "Nothing to send"
          )}
        </Figure>

        <Figure
          title="Paid this month"
          icon={IconCalendarCheck}
          value={formatFcfa(summary?.paidThisMonth.amount ?? 0)}
          isLoading={queue.isLoading}
        >
          {summary?.paidThisMonth.count === 1
            ? "1 payout since the 1st"
            : `${summary?.paidThisMonth.count ?? 0} payouts since the 1st`}
        </Figure>
      </div>

      <PayoutsChart />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Withdrawal requests</CardTitle>
          <p className="text-muted-foreground text-xs">
            Send each one from Rabotka's Mobile Money account, then press Pay
            and enter the transaction reference. Requests waiting more than two
            days are highlighted. The agent gets an email either way.
          </p>
        </CardHeader>
        <CardContent>
          <AgentWithdrawalsList
            layout="table"
            defaultStatus="REQUESTED"
            canProcess={canProcessAgentWithdrawal(role)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
