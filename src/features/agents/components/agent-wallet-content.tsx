import { useState } from "react";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCash,
  IconClock,
  IconReceipt,
  IconWallet,
} from "@tabler/icons-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { useAgentWallet } from "#/hooks/use-agents";
import { formatDateTime } from "#/pages/profile-detail/helpers";
import { AgentCommissionsCard } from "./agent-commissions-card";
import { AgentWithdrawalsList } from "./agent-withdrawals-list";
import {
  LEDGER_BUCKET_LABELS,
  LEDGER_KIND_LABELS,
  formatFcfa,
} from "../agent-rules";

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
  const entries = data?.entries;
  const pages = entries ? Math.max(Math.ceil(entries.total / entries.limit), 1) : 1;

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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`s-${i + 1}`} className="h-10 w-full" />
              ))}
            </div>
          )}

          {!isLoading && entries?.data.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <IconWallet className="text-muted-foreground size-10" />
              <p className="text-sm font-medium">No movement yet</p>
              <p className="text-muted-foreground max-w-sm text-xs">
                Commissions appear here once a worker this agent placed has paid,
                and withdrawals once the agent requests one.
              </p>
            </div>
          )}

          {!isLoading && !!entries?.data.length && (
            <div className="divide-border divide-y">
              {entries.data.map((e) => {
                const incoming = e.amount >= 0;
                const Icon = incoming ? IconArrowDownLeft : IconArrowUpRight;
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                          incoming
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {LEDGER_KIND_LABELS[e.kind] ?? e.kind}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {formatDateTime(e.createdAt)}
                          {e.description ? ` · ${e.description}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant="outline" className="font-normal">
                        {LEDGER_BUCKET_LABELS[e.bucket] ?? e.bucket}
                      </Badge>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          incoming ? "text-emerald-600" : ""
                        }`}
                      >
                        {incoming ? "+" : ""}
                        {formatFcfa(e.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2 text-sm">
              <span className="text-muted-foreground">
                Page {page} of {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
