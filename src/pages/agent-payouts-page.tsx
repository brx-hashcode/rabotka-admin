import { IconCash, IconClockHour4 } from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import {
  canProcessAgentWithdrawal,
  formatFcfa,
} from "#/features/agents/agent-rules";
import { AgentWithdrawalsList } from "#/features/agents/components/agent-withdrawals-list";
import { useAgentWithdrawals } from "#/hooks/use-agents";
import { useRole } from "#/hooks/use-role";

/**
 * Where agents get paid: every withdrawal request, oldest first. An admin
 * sends the Mobile Money transfer, then records its reference — or rejects
 * the request and the money goes back to the agent's balance.
 */
export default function AgentPayoutsPage() {
  const { role } = useRole();
  // The same query the list makes for "To pay", page 1 — served from cache.
  const queue = useAgentWithdrawals({ status: "REQUESTED", page: 1 });
  const open = queue.data?.open;

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Requests to pay
            </CardTitle>
            <IconClockHour4 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {queue.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">
                {open?.count ?? 0}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Agents waiting for their money
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Amount to send
            </CardTitle>
            <IconCash className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            {queue.isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">
                {formatFcfa(open?.amount ?? 0)}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Total of the open requests, by Mobile Money
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Withdrawal requests</CardTitle>
          <p className="text-muted-foreground text-xs">
            Pay each request from Rabotka's Mobile Money account, then record
            the transaction reference here. The agent gets an email either way.
          </p>
        </CardHeader>
        <CardContent>
          <AgentWithdrawalsList
            defaultStatus="REQUESTED"
            canProcess={canProcessAgentWithdrawal(role)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
