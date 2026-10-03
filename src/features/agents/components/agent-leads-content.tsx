import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  IconCircleCheck,
  IconPhoneCall,
  IconPhoneOff,
  IconUsers,
  IconEye,
} from "@tabler/icons-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { ProfileCell } from "#/components/table/profile-cell";
import { useAgentLeads, useAgentReveals } from "#/hooks/use-agents";
import type { AgentLead, AgentLeadStatus } from "#/lib/api/agents-controller";
import { formatDateTime } from "#/pages/profile-detail/helpers";
import {
  CALL_OUTCOME_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  leadStatusBadgeClass,
  leadTotals,
} from "../agent-rules";

function StatCard({
  title,
  icon: Icon,
  value,
  hint,
  isLoading,
}: Readonly<{
  title: string;
  icon: React.ElementType;
  value: string;
  hint: string;
  isLoading: boolean;
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
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        )}
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Pager({
  page,
  total,
  limit,
  onChange,
}: Readonly<{
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}>) {
  const pages = Math.max(Math.ceil(total / limit), 1);
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <span className="text-muted-foreground">
        Page {page} of {pages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
      >
        Next
      </Button>
    </div>
  );
}

/** Where the lead stands in time: until when it is held, or when it ended. */
function leadTiming(lead: AgentLead): string {
  switch (lead.status) {
    case "CLAIMED":
      return lead.mine
        ? `Held until ${formatDateTime(lead.claimExpiresAt)}`
        : "Claim lapsed — other agents can take this worker";
    case "INVITED":
      return lead.inviteLapsed
        ? `Invitation expired ${formatDateTime(lead.inviteExpiresAt)}`
        : `Invitation valid until ${formatDateTime(lead.inviteExpiresAt)}`;
    default:
      return lead.decidedAt
        ? `${LEAD_STATUS_LABELS[lead.status]} ${formatDateTime(lead.decidedAt)}`
        : `Updated ${formatDateTime(lead.updatedAt)}`;
  }
}

function LeadRow({ lead }: Readonly<{ lead: AgentLead }>) {
  return (
    <div className="space-y-2 py-4">
      <div className="flex items-start justify-between gap-4">
        <Link
          to="/profiles/$profileId"
          params={{ profileId: lead.worker.id }}
          className="min-w-0 hover:opacity-80"
        >
          <ProfileCell
            name={`${lead.worker.firstName} ${lead.worker.lastName}`.trim()}
            avatarUrl={lead.worker.avatarUrl}
          />
        </Link>
        <Badge className={leadStatusBadgeClass(lead.status)}>
          {LEAD_STATUS_LABELS[lead.status]}
        </Badge>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 pl-11 text-xs">
        <Link
          to="/jobs/$jobId"
          params={{ jobId: lead.job.id }}
          className="text-foreground font-medium hover:underline"
        >
          {lead.job.title}
        </Link>
        {lead.job.city && <span>· {lead.job.city}</span>}
        <span>· {leadTiming(lead)}</span>
        {lead.revealCount > 0 && (
          <span>
            · number seen {lead.revealCount === 1 ? "once" : `${lead.revealCount} times`}
          </span>
        )}
      </div>

      {lead.calls.length > 0 && (
        <ol className="bg-muted/50 ml-11 space-y-1.5 rounded-md px-3 py-2">
          {lead.calls.map((call) => (
            <li key={call.id} className="flex gap-2 text-xs">
              <IconPhoneCall className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
              <span className="min-w-0">
                <span className="font-medium">
                  {CALL_OUTCOME_LABELS[call.outcome] ?? call.outcome}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {formatDateTime(call.at)}
                </span>
                {call.note && (
                  <span className="text-muted-foreground block break-words">
                    “{call.note}”
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * What the agent did with the workers they were shown: whom they took, every
 * call and its outcome, who got an invitation and who applied — plus every
 * phone number they looked up, which is the part worth watching for abuse.
 */
export function AgentLeadsContent({ agentId }: Readonly<{ agentId: string }>) {
  const [status, setStatus] = useState<AgentLeadStatus | undefined>();
  const [page, setPage] = useState(1);
  const [revealPage, setRevealPage] = useState(1);

  const leads = useAgentLeads(agentId, status, page);
  const reveals = useAgentReveals(agentId, revealPage);
  const counts = leads.data?.counts ?? {};
  const totals = leadTotals(counts);

  const pickStatus = (next: AgentLeadStatus | undefined) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Workers taken"
          icon={IconUsers}
          value={String(totals.total)}
          hint={`${totals.inProgress} still in progress`}
          isLoading={leads.isLoading}
        />
        <StatCard
          title="Applied"
          icon={IconCircleCheck}
          value={String(totals.applied)}
          hint={
            totals.conversion === null
              ? "No finished lead yet"
              : `${totals.conversion}% of finished leads`
          }
          isLoading={leads.isLoading}
        />
        <StatCard
          title="Declined or unreachable"
          icon={IconPhoneOff}
          value={String(totals.closed)}
          hint="Said no, or never answered"
          isLoading={leads.isLoading}
        />
        <StatCard
          title="Numbers seen today"
          icon={IconEye}
          value={
            reveals.data
              ? `${reveals.data.today} / ${reveals.data.dailyCap}`
              : "—"
          }
          hint="Different workers, Brazzaville time"
          isLoading={reveals.isLoading}
        />
      </div>

      <div className="grid grid-cols-5 gap-6">
        <Card className="col-span-5 min-w-0 lg:col-span-3">
          <CardHeader className="space-y-3">
            <CardTitle className="text-sm">Leads &amp; calls</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={status === undefined ? "secondary" : "ghost"}
                onClick={() => pickStatus(undefined)}
              >
                All
                <span className="text-muted-foreground tabular-nums">
                  {totals.total}
                </span>
              </Button>
              {LEAD_STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={status === s ? "secondary" : "ghost"}
                  onClick={() => pickStatus(s)}
                >
                  {LEAD_STATUS_LABELS[s]}
                  <span className="text-muted-foreground tabular-nums">
                    {counts[s] ?? 0}
                  </span>
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {leads.isError && (
              <p className="text-muted-foreground py-10 text-center text-sm">
                Couldn't load the leads. Try again.
              </p>
            )}

            {leads.isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={`s-${i + 1}`} className="h-14 w-full" />
                ))}
              </div>
            )}

            {!leads.isLoading && leads.data?.data.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <IconPhoneCall className="text-muted-foreground size-10" />
                <p className="text-sm font-medium">
                  {status ? "No lead with this status" : "No lead yet"}
                </p>
                <p className="text-muted-foreground max-w-sm text-xs">
                  A lead appears when the agent takes a suggested worker for a
                  job in the agent app.
                </p>
              </div>
            )}

            {!!leads.data?.data.length && (
              <div className="divide-border divide-y">
                {leads.data.data.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} />
                ))}
              </div>
            )}

            {leads.data && (
              <Pager
                page={page}
                total={leads.data.total}
                limit={leads.data.limit}
                onChange={setPage}
              />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-5 min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Phone numbers seen</CardTitle>
            <p className="text-muted-foreground text-xs">
              Every time the agent displayed a worker's number.
            </p>
          </CardHeader>
          <CardContent>
            {reveals.isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`r-${i + 1}`} className="h-10 w-full" />
                ))}
              </div>
            )}

            {!reveals.isLoading && reveals.data?.data.length === 0 && (
              <p className="text-muted-foreground py-10 text-center text-sm">
                No number seen yet.
              </p>
            )}

            {!!reveals.data?.data.length && (
              <div className="divide-border divide-y">
                {reveals.data.data.map((r) => (
                  <div key={r.id} className="space-y-1 py-3">
                    <Link
                      to="/profiles/$profileId"
                      params={{ profileId: r.worker.id }}
                      className="block hover:opacity-80"
                    >
                      <ProfileCell
                        name={`${r.worker.firstName} ${r.worker.lastName}`.trim()}
                        email={r.job.title}
                        avatarUrl={r.worker.avatarUrl}
                      />
                    </Link>
                    <p className="text-muted-foreground pl-11 text-xs">
                      {formatDateTime(r.at)}
                      {r.ipAddress ? ` · IP ${r.ipAddress}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {reveals.data && (
              <Pager
                page={revealPage}
                total={reveals.data.total}
                limit={reveals.data.limit}
                onChange={setRevealPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
