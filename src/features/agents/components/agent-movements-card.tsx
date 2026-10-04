import { Link } from "@tanstack/react-router";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconArrowsExchange,
  IconWallet,
} from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type { AgentMovement, AgentWallet } from "#/lib/api/agents-controller";
import { formatDateTime } from "#/pages/profile-detail/helpers";
import {
  MOMO_OPERATOR_LABELS,
  formatFcfa,
  movementFlow,
  movementView,
  type MovementTone,
} from "../agent-rules";

const TONE: Record<
  MovementTone,
  { icon: React.ElementType; badge: string; amount: string; sign: string }
> = {
  gain: {
    icon: IconArrowDownLeft,
    badge: "bg-emerald-500/10 text-emerald-600",
    amount: "text-emerald-600",
    sign: "+",
  },
  loss: {
    icon: IconArrowUpRight,
    badge: "bg-rose-500/10 text-rose-600",
    amount: "text-rose-600",
    sign: "−",
  },
  neutral: {
    icon: IconArrowsExchange,
    badge: "bg-muted text-muted-foreground",
    amount: "",
    sign: "",
  },
};

/** What the movement is about, linked where there is something to open. */
function MovementSubject({ m }: Readonly<{ m: AgentMovement }>) {
  if (m.commission) {
    const { worker, job } = m.commission;
    return (
      <>
        {worker.name ? (
          <Link
            to="/profiles/$profileId"
            params={{ profileId: worker.id }}
            className="text-foreground hover:underline"
          >
            {worker.name}
          </Link>
        ) : (
          <span>Worker removed</span>
        )}
        <span> · </span>
        {job.title ? (
          <Link
            to="/jobs/$jobId"
            params={{ jobId: job.id }}
            className="text-foreground hover:underline"
          >
            {job.title}
          </Link>
        ) : (
          <span>Job removed</span>
        )}
      </>
    );
  }
  if (m.withdrawal) {
    return (
      <span>
        {MOMO_OPERATOR_LABELS[m.withdrawal.momoOperator]} ·{" "}
        <span className="text-foreground tabular-nums">
          {m.withdrawal.momoPhone}
        </span>
      </span>
    );
  }
  return null;
}

/** The facts worth checking later: reference, who, why. */
function movementDetails(m: AgentMovement): string[] {
  const details = [formatDateTime(m.at)];
  const w = m.withdrawal;
  if (w && m.kind === "WITHDRAWAL_PAID") {
    if (w.providerReference) details.push(`Ref. ${w.providerReference}`);
    if (w.processedBy) details.push(`by ${w.processedBy}`);
  }
  if (w && m.kind === "WITHDRAWAL_REJECTED") {
    if (w.processedBy) details.push(`by ${w.processedBy}`);
    if (w.rejectionReason) details.push(w.rejectionReason);
  }
  if (m.kind === "COMMISSION_CANCELLED") {
    const reason = m.description ?? m.commission?.reason;
    if (reason) details.push(reason);
  }
  return details;
}

/**
 * The agent's money, one event per line: earned, released, cancelled,
 * requested, paid, rejected — with the worker and job, or the payout details,
 * and where the money moved.
 */
export function AgentMovementsCard({
  movements,
  isLoading,
  page,
  onPageChange,
}: Readonly<{
  movements: AgentWallet["movements"] | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}>) {
  const pages = movements
    ? Math.max(Math.ceil(movements.total / movements.limit), 1)
    : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Movements</CardTitle>
        <p className="text-muted-foreground text-xs">
          Every change to the agent's balance, newest first.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`m-${i + 1}`} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && movements?.data.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <IconWallet className="text-muted-foreground size-10" />
            <p className="text-sm font-medium">No movement yet</p>
            <p className="text-muted-foreground max-w-sm text-xs">
              Commissions appear here once a worker this agent placed has paid,
              and withdrawals once the agent requests one.
            </p>
          </div>
        )}

        {!isLoading && !!movements?.data.length && (
          <div className="divide-border divide-y">
            {movements.data.map((m) => {
              const view = movementView(m);
              const tone = TONE[view.tone];
              const Icon = tone.icon;
              return (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${tone.badge}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium">{view.title}</p>
                      {(m.commission || m.withdrawal) && (
                        <p className="text-muted-foreground truncate text-xs">
                          <MovementSubject m={m} />
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        {movementDetails(m).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold tabular-nums ${tone.amount}`}
                    >
                      {tone.sign}
                      {formatFcfa(m.amount)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {movementFlow(m.moves)}
                    </p>
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
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
