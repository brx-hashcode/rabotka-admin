import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconCoin, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { ReasonField } from "#/components/reason-field";
import { ProfileCell } from "#/components/table/profile-cell";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import { agentsQueryKey, useAgentCommissions } from "#/hooks/use-agents";
import {
  cancelAgentCommission,
  type AgentCommission,
} from "#/lib/api/agents-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { formatDateTime } from "#/pages/profile-detail/helpers";
import {
  COMMISSION_STATUS_LABELS,
  commissionStatusBadgeClass,
  formatFcfa,
  isCancellableCommission,
} from "../agent-rules";

/** Where the commission stands in time, in one line. */
function commissionTiming(c: AgentCommission): string {
  switch (c.status) {
    case "PENDING":
      return c.availableAt
        ? `Withdrawable from ${formatDateTime(c.availableAt)}`
        : "Waiting for the mission to be done";
    case "AVAILABLE":
      return `Withdrawable since ${formatDateTime(c.releasedAt)}`;
    case "CANCELLED":
      return `Cancelled ${formatDateTime(c.cancelledAt)}`;
    default:
      return `Placement of ${formatDateTime(c.createdAt)}`;
  }
}

function CancelCommissionDialog({
  agentId,
  commission,
  onClose,
}: Readonly<{
  agentId: string;
  commission: AgentCommission | null;
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [attempted, setAttempted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      cancelAgentCommission(agentId, commission!.id, reason.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...agentsQueryKey, "detail", agentId],
      });
      toast.success("Commission cancelled.");
      setReason("");
      setAttempted(false);
      onClose();
    },
  });

  const tooShort = reason.trim().length < 3;
  const confirm = () => {
    setAttempted(true);
    if (tooShort) return;
    mutation.mutate();
  };

  return (
    <Dialog
      open={commission !== null}
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {commission && (
          <>
            <DialogHeader>
              <DialogTitle>Cancel this commission?</DialogTitle>
              <DialogDescription>
                {formatFcfa(commission.amount)} for placing{" "}
                <span className="text-foreground font-medium">
                  {`${commission.worker.firstName ?? ""} ${commission.worker.lastName ?? ""}`.trim() ||
                    "this worker"}
                </span>
                . It is taken back from the agent's{" "}
                {commission.status === "AVAILABLE" ? "withdrawable" : "waiting"}{" "}
                balance. This can't be undone.
              </DialogDescription>
            </DialogHeader>

            <ReasonField
              value={reason}
              onChange={setReason}
              templateScope={null}
              placeholder="Why? For example, the placement was not real."
              required
              error={attempted && tooShort}
              errorMessage="Give a reason (at least 3 characters)."
              disabled={mutation.isPending}
            />

            {mutation.isError && (
              <p className="text-destructive text-sm">
                {friendlyError(
                  mutation.error,
                  "Couldn't cancel this commission.",
                )}
              </p>
            )}

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Keep it
              </Button>
              <Button
                variant="destructive"
                onClick={confirm}
                disabled={mutation.isPending}
              >
                {mutation.isPending && (
                  <IconLoader2 className="size-4 animate-spin" />
                )}
                Cancel commission
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * One row per placement the agent made: what it pays and where it stands —
 * or, when it pays nothing, why. Sits under the wallet's movements.
 */
export function AgentCommissionsCard({
  agentId,
  canCancel,
}: Readonly<{ agentId: string; canCancel: boolean }>) {
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<AgentCommission | null>(null);
  const { data, isLoading, isError } = useAgentCommissions(agentId, page, true);
  const pages = data ? Math.max(Math.ceil(data.total / data.limit), 1) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Commissions</CardTitle>
        <p className="text-muted-foreground text-xs">
          One per worker this agent placed.
        </p>
      </CardHeader>
      <CardContent>
        {isError && (
          <p className="text-muted-foreground py-10 text-center text-sm">
            Couldn't load the commissions. Try again.
          </p>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`c-${i + 1}`} className="h-12 w-full" />
            ))}
          </div>
        )}

        {!isLoading && data?.data.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <IconCoin className="text-muted-foreground size-10" />
            <p className="text-sm font-medium">No commission yet</p>
            <p className="text-muted-foreground max-w-sm text-xs">
              A commission appears once a worker this agent invited is hired
              and both sides have paid.
            </p>
          </div>
        )}

        {!!data?.data.length && (
          <div className="divide-border divide-y">
            {data.data.map((c) => (
              <div key={c.id} className="space-y-1.5 py-3">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    to="/profiles/$profileId"
                    params={{ profileId: c.worker.id }}
                    className="min-w-0 hover:opacity-80"
                  >
                    <ProfileCell
                      name={`${c.worker.firstName ?? ""} ${c.worker.lastName ?? ""}`.trim()}
                      avatarUrl={c.worker.avatarUrl}
                    />
                  </Link>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge className={commissionStatusBadgeClass(c.status)}>
                      {COMMISSION_STATUS_LABELS[c.status]}
                    </Badge>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        c.status === "CANCELLED" || c.status === "INELIGIBLE"
                          ? "text-muted-foreground line-through"
                          : ""
                      }`}
                    >
                      {formatFcfa(c.amount)}
                    </span>
                  </div>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 pl-11 text-xs">
                  {c.job.title ? (
                    <Link
                      to="/jobs/$jobId"
                      params={{ jobId: c.job.id }}
                      className="text-foreground font-medium hover:underline"
                    >
                      {c.job.title}
                    </Link>
                  ) : (
                    <span>Job removed</span>
                  )}
                  <span>· {commissionTiming(c)}</span>
                  {canCancel && isCancellableCommission(c.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive ml-auto h-6 px-2 text-xs"
                      onClick={() => setCancelling(c)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {c.reason && (
                  <p className="text-muted-foreground pl-11 text-xs">
                    {c.reason}
                  </p>
                )}
              </div>
            ))}
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
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>

      <CancelCommissionDialog
        agentId={agentId}
        commission={cancelling}
        onClose={() => setCancelling(null)}
      />
    </Card>
  );
}
