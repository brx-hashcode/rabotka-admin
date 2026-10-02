import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import type {
  AdminAgentDetail,
  AgentBalance,
} from "#/lib/api/agents-controller";
import {
  formatDate,
  formatDateTime,
} from "#/pages/profile-detail/helpers";
import {
  AGENT_STATUS_LABELS,
  formatFcfa,
  getAgentStatusBadgeClass,
} from "../agent-rules";

function Row({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-muted-foreground shrink-0">{label}</div>
      <div className="text-right font-medium">{children}</div>
    </div>
  );
}

type Props = {
  readonly agent: AdminAgentDetail;
  /** Null for roles that may not see money (the card is then omitted). */
  readonly balance: AgentBalance | null | undefined;
  readonly balanceLoading: boolean;
  readonly onOpenWallet: () => void;
};

/** Right-hand column of the General tab, as on the profile page. */
export function AgentSummary({
  agent,
  balance,
  balanceLoading,
  onOpenWallet,
}: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <Row label="Agent">
              <Badge className={getAgentStatusBadgeClass(agent.status)}>
                {AGENT_STATUS_LABELS[agent.status]}
              </Badge>
            </Row>
            {/* Only while not active: the server clears the reason on
                reactivation, so this always explains the current state. */}
            {agent.statusReason && (
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  {agent.status === "REVOKED" ? "Revocation" : "Suspension"}{" "}
                  reason
                </p>
                <p className="mt-1 font-medium">{agent.statusReason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {balance !== null && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Earnings</CardTitle>
            <button
              type="button"
              onClick={onOpenWallet}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Wallet →
            </button>
          </CardHeader>
          <CardContent>
            {balanceLoading || !balance ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <Row label="Available">
                  <span className="text-emerald-600">
                    {formatFcfa(balance.available)}
                  </span>
                </Row>
                <Row label="Pending">{formatFcfa(balance.pending)}</Row>
                {balance.locked > 0 && (
                  <Row label="Withdrawal in progress">
                    {formatFcfa(balance.locked)}
                  </Row>
                )}
                <Row label="Paid out">{formatFcfa(balance.paidOut)}</Row>
                <Row label="Total earned">
                  {formatFcfa(balance.totalEarned)}
                </Row>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            {/* Zones live in the form beside this, the identity document on the
                Identity tab — repeating them here only made the card long. */}
            <Row label="Agent since">
              {formatDate(agent.createdAt)}
              {agent.createdByName && (
                <span className="text-muted-foreground block text-xs font-normal">
                  by {agent.createdByName}
                </span>
              )}
            </Row>
            <Row label="Last sign-in">
              {agent.lastLoginAt ? (
                formatDateTime(agent.lastLoginAt)
              ) : (
                <span className="text-muted-foreground font-normal">
                  Never signed in
                </span>
              )}
            </Row>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
