import { useState } from "react";
import {
  IconCash,
  IconClock,
  IconReceipt,
  IconWallet,
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useAgentWallet } from "#/hooks/use-agents";
import { AgentCommissionsCard } from "./agent-commissions-card";
import { AgentMovementsCard } from "./agent-movements-card";
import { AgentWithdrawalsList } from "./agent-withdrawals-list";
import { formatFcfa } from "../agent-rules";

function StatCard({
  title,
  icon: Icon,
  value,
  hint,
  isLoading,
  accent,
}: Readonly<{
  title: string;
  icon: React.ElementType;
  value: number;
  hint: string;
  isLoading: boolean;
  accent?: string;
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
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>
            {formatFcfa(value)}
          </p>
        )}
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

/**
 * The agent's money: what they can withdraw, what is still in its
 * confirmation window, what Rabotka already paid, and every movement behind
 * those figures. Read-only — balances are computed from the append-only ledger
 * on the server; nothing here edits them.
 */
export function AgentWalletContent({
  agentId,
  canCancelCommissions,
  canProcessWithdrawals,
}: Readonly<{
  agentId: string;
  canCancelCommissions: boolean;
  canProcessWithdrawals: boolean;
}>) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAgentWallet(agentId, page, true);
  const balance = data?.balance;
  const movements = data?.movements;

  if (isError) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Couldn't load the wallet. Try again.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* A requested withdrawal is set aside in the ledger (LOCKED) so the
            agent cannot ask for it twice, but it is still the agent's money
            until an admin pays it — so it counts here, and leaves only when
            the payment is confirmed. */}
        <StatCard
          title="Available"
          icon={IconWallet}
          value={(balance?.available ?? 0) + (balance?.locked ?? 0)}
          hint={
            balance?.locked
              ? `Including ${formatFcfa(balance.locked)} requested — paid out when you confirm`
              : "Can be withdrawn now"
          }
          isLoading={isLoading}
          accent="text-emerald-600"
        />
        <StatCard
          title="Pending"
          icon={IconClock}
          value={balance?.pending ?? 0}
          hint="In the confirmation window"
          isLoading={isLoading}
        />
        <StatCard
          title="Paid out"
          icon={IconCash}
          value={balance?.paidOut ?? 0}
          hint="Transferred by Rabotka"
          isLoading={isLoading}
        />
        <StatCard
          title="Total earned"
          icon={IconReceipt}
          value={balance?.totalEarned ?? 0}
          hint="All commissions, before cancellations"
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Withdrawals</CardTitle>
          <p className="text-muted-foreground text-xs">
            What the agent asked to be paid, and what was sent.
          </p>
        </CardHeader>
        <CardContent>
          <AgentWithdrawalsList
            agentId={agentId}
            canProcess={canProcessWithdrawals}
          />
        </CardContent>
      </Card>

      <AgentCommissionsCard
        agentId={agentId}
        canCancel={canCancelCommissions}
      />

      <AgentMovementsCard
        movements={movements}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
