import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowBackUp,
  IconCoin,
  IconDots,
  IconLoader2,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ReasonField } from "#/components/reason-field";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
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

/** What the status means for this one, in a sentence. */
function commissionStatusSentence(c: AgentCommission): string {
  switch (c.status) {
    case "PENDING":
      return c.availableAt
        ? `Becomes withdrawable on ${formatDateTime(c.availableAt)} — unless the worker doesn't show up or the mission is cancelled.`
        : "Becomes withdrawable once the mission is marked done.";
    case "AVAILABLE":
      return `Counts in the agent's available balance since ${formatDateTime(c.releasedAt)}.`;
    case "CANCELLED":
      return `Taken back on ${formatDateTime(c.cancelledAt)}${c.reason ? `: ${c.reason}` : "."}`;
    default:
      return `This placement earns nothing${c.reason ? `: ${c.reason}` : "."}`;
  }
}

const STATUS_GUIDE: { status: AgentCommission["status"]; text: string }[] = [
  { status: "PENDING", text: "both sides paid, in the waiting time" },
  { status: "AVAILABLE", text: "in the agent's available balance" },
  { status: "CANCELLED", text: "taken back (no-show, cancelled mission, admin)" },
  { status: "INELIGIBLE", text: "the placement didn't qualify" },
];

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
      toast.success("Commission taken back.");
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
              <DialogTitle>Take back this commission?</DialogTitle>
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
                Take it back
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
          Each time a worker this agent invited is hired and both sides pay,
          the agent earns a commission. It waits a few days in case the worker
          doesn't show up, then becomes withdrawable.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
          {STATUS_GUIDE.map((g) => (
            <span
              key={g.status}
              className="text-muted-foreground flex items-center gap-1.5 text-xs"
            >
              <Badge className={commissionStatusBadgeClass(g.status)}>
                {COMMISSION_STATUS_LABELS[g.status]}
              </Badge>
              {g.text}
            </span>
          ))}
        </div>
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
            {data.data.map((c) => {
              const name =
                `${c.worker.firstName ?? ""} ${c.worker.lastName ?? ""}`.trim() ||
                "a worker";
              const earnsNothing =
                c.status === "CANCELLED" || c.status === "INELIGIBLE";
              return (
                <div key={c.id} className="flex items-start gap-3 py-4">
                  <Avatar className="mt-0.5 size-8">
                    {c.worker.avatarUrl && (
                      <AvatarImage
                        src={c.worker.avatarUrl}
                        alt={name}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm">
                      Placed{" "}
                      <Link
                        to="/profiles/$profileId"
                        params={{ profileId: c.worker.id }}
                        className="font-medium hover:underline"
                      >
                        {name}
                      </Link>{" "}
                      on{" "}
                      {c.job.title ? (
                        <Link
                          to="/jobs/$jobId"
                          params={{ jobId: c.job.id }}
                          className="font-medium hover:underline"
                        >
                          « {c.job.title} »
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">a removed job</span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {commissionStatusSentence(c)}
                    </p>
                    <p className="text-muted-foreground/70 text-[11px]">
                      Placement of {formatDateTime(c.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className={commissionStatusBadgeClass(c.status)}>
                      {COMMISSION_STATUS_LABELS[c.status]}
                    </Badge>
                    <span
                      className={`w-24 text-right text-sm font-semibold tabular-nums ${
                        earnsNothing ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {formatFcfa(c.amount)}
                    </span>
                    {canCancel && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Commission actions"
                            disabled={!isCancellableCommission(c.status)}
                            className={
                              isCancellableCommission(c.status) ? "" : "invisible"
                            }
                          >
                            <IconDots className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setCancelling(c)}
                          >
                            <IconArrowBackUp className="size-4" />
                            Take back commission…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
