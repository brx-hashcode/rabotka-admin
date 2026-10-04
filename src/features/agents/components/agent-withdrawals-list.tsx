import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconCash,
  IconCheck,
  IconCopy,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { ReasonField } from "#/components/reason-field";
import { ProfileCell } from "#/components/table/profile-cell";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Skeleton } from "#/components/ui/skeleton";
import { agentsQueryKey, useAgentWithdrawals } from "#/hooks/use-agents";
import {
  payAgentWithdrawal,
  rejectAgentWithdrawal,
  type AgentWithdrawal,
  type AgentWithdrawalStatus,
} from "#/lib/api/agents-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { formatDateTime } from "#/pages/profile-detail/helpers";
import {
  MOMO_OPERATOR_LABELS,
  WITHDRAWAL_STATUS_LABELS,
  formatFcfa,
  withdrawalStatusBadgeClass,
} from "../agent-rules";

const agentName = (w: AgentWithdrawal) =>
  `${w.agent.firstName} ${w.agent.lastName}`.trim();

/** The transfer to send, laid out to be copied into the Mobile Money app. */
function TransferDetails({ withdrawal }: Readonly<{ withdrawal: AgentWithdrawal }>) {
  const copy = (text: string) => {
    void navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success("Copied."))
      .catch(() => undefined);
  };
  return (
    <div className="bg-muted/50 space-y-2 rounded-md px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Amount</span>
        <span className="font-semibold tabular-nums">
          {formatFcfa(withdrawal.amount)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Network</span>
        <span>{MOMO_OPERATOR_LABELS[withdrawal.momoOperator]}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Number</span>
        <button
          type="button"
          onClick={() => copy(withdrawal.momoPhone)}
          className="flex items-center gap-1.5 font-medium tabular-nums hover:opacity-80"
        >
          {withdrawal.momoPhone}
          <IconCopy className="text-muted-foreground size-3.5" />
        </button>
      </div>
    </div>
  );
}

function PayDialog({
  withdrawal,
  onClose,
}: Readonly<{ withdrawal: AgentWithdrawal | null; onClose: () => void }>) {
  const queryClient = useQueryClient();
  const [reference, setReference] = useState("");
  const [attempted, setAttempted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => payAgentWithdrawal(withdrawal!.id, reference.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      toast.success(`Marked as paid. ${withdrawal ? agentName(withdrawal) : "The agent"} gets an email.`);
      setReference("");
      setAttempted(false);
      onClose();
    },
  });

  const tooShort = reference.trim().length < 3;
  const confirm = () => {
    setAttempted(true);
    if (tooShort) return;
    mutation.mutate();
  };

  return (
    <Dialog
      open={withdrawal !== null}
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {withdrawal && (
          <>
            <DialogHeader>
              <DialogTitle>Pay {agentName(withdrawal)}</DialogTitle>
              <DialogDescription>
                Send this transfer from Rabotka's Mobile Money account first,
                then enter the reference the network gives you. Confirming
                takes {formatFcfa(withdrawal.amount)} off the agent's available
                balance and adds it to paid out.
              </DialogDescription>
            </DialogHeader>

            <TransferDetails withdrawal={withdrawal} />

            <div className="space-y-1.5">
              <Label htmlFor="withdrawal-reference">
                Transaction reference <span className="text-destructive">*</span>
              </Label>
              <Input
                id="withdrawal-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="For example MP261003.1423.A12345"
                disabled={mutation.isPending}
                aria-invalid={attempted && tooShort}
                autoFocus
              />
              {attempted && tooShort && (
                <p className="text-destructive text-xs">
                  Enter the reference of the transfer you sent.
                </p>
              )}
            </div>

            {mutation.isError && (
              <p className="text-destructive text-sm">
                {friendlyError(mutation.error, "Couldn't record this payment.")}
              </p>
            )}

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Not yet
              </Button>
              <Button onClick={confirm} disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconCheck className="size-4" />
                )}
                I sent it — mark as paid
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  withdrawal,
  onClose,
}: Readonly<{ withdrawal: AgentWithdrawal | null; onClose: () => void }>) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [attempted, setAttempted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => rejectAgentWithdrawal(withdrawal!.id, reason.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      toast.success("Rejected. The amount is back in the agent's balance.");
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
      open={withdrawal !== null}
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {withdrawal && (
          <>
            <DialogHeader>
              <DialogTitle>Reject this withdrawal?</DialogTitle>
              <DialogDescription>
                {formatFcfa(withdrawal.amount)} for{" "}
                <span className="text-foreground font-medium">
                  {agentName(withdrawal)}
                </span>
                . The amount goes back to their withdrawable balance, and they
                get an email with your reason.
              </DialogDescription>
            </DialogHeader>

            <ReasonField
              value={reason}
              onChange={setReason}
              templateScope={null}
              placeholder="For example: the Mobile Money number is wrong."
              required
              error={attempted && tooShort}
              errorMessage="Give a reason (at least 3 characters)."
              disabled={mutation.isPending}
            />

            {mutation.isError && (
              <p className="text-destructive text-sm">
                {friendlyError(mutation.error, "Couldn't reject this withdrawal.")}
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
                Reject
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const STATUS_FILTERS: { label: string; value: AgentWithdrawalStatus | undefined }[] = [
  { label: "To pay", value: "REQUESTED" },
  { label: "Paid", value: "PAID" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: undefined },
];

/**
 * Withdrawal requests with what to send and where, and the two decisions.
 * Without `agentId` it is the payout queue across agents.
 */
export function AgentWithdrawalsList({
  agentId,
  defaultStatus,
  canProcess,
}: Readonly<{
  agentId?: string;
  defaultStatus?: AgentWithdrawalStatus;
  canProcess: boolean;
}>) {
  const [status, setStatus] = useState<AgentWithdrawalStatus | undefined>(
    defaultStatus,
  );
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState<AgentWithdrawal | null>(null);
  const [rejecting, setRejecting] = useState<AgentWithdrawal | null>(null);
  const { data, isLoading, isError } = useAgentWithdrawals({
    agentId,
    status,
    page,
  });
  const pages = data ? Math.max(Math.ceil(data.total / data.limit), 1) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.label}
            size="sm"
            variant={status === f.value ? "secondary" : "ghost"}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {f.label}
            {f.value === "REQUESTED" && !!data?.open.count && (
              <span className="text-muted-foreground tabular-nums">
                {data.open.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isError && (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Couldn't load the withdrawals. Try again.
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`w-${i + 1}`} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && data?.data.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <IconCash className="text-muted-foreground size-10" />
          <p className="text-sm font-medium">
            {status === "REQUESTED" ? "Nothing to pay" : "No withdrawal"}
          </p>
          <p className="text-muted-foreground max-w-sm text-xs">
            Agents ask for a withdrawal from their app, out of their
            withdrawable balance.
          </p>
        </div>
      )}

      {!!data?.data.length && (
        <div className="divide-border divide-y">
          {data.data.map((w) => {
            const actionable = canProcess && w.status === "REQUESTED";
            return (
              <div
                key={w.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {agentId ? (
                      <p className="text-base font-semibold tabular-nums">
                        {formatFcfa(w.amount)}
                      </p>
                    ) : (
                      <Link
                        to="/agents/$agentId"
                        params={{ agentId: w.agent.id }}
                        search={{ tab: "wallet" }}
                        className="min-w-0 hover:opacity-80"
                      >
                        <ProfileCell
                          name={agentName(w)}
                          email={formatFcfa(w.amount)}
                          avatarUrl={w.agent.avatarUrl}
                        />
                      </Link>
                    )}
                    <Badge className={withdrawalStatusBadgeClass(w.status)}>
                      {WITHDRAWAL_STATUS_LABELS[w.status]}
                    </Badge>
                  </div>
                  <p
                    className={`text-muted-foreground text-xs ${agentId ? "" : "pl-11"}`}
                  >
                    {MOMO_OPERATOR_LABELS[w.momoOperator]} · {w.momoPhone} ·
                    requested {formatDateTime(w.createdAt)}
                    {w.status === "PAID" &&
                      ` · paid ${formatDateTime(w.processedAt)} · ref. ${w.providerReference}`}
                    {w.status === "REJECTED" &&
                      ` · rejected ${formatDateTime(w.processedAt)}`}
                  </p>
                  {w.rejectionReason && (
                    <p
                      className={`text-muted-foreground text-xs ${agentId ? "" : "pl-11"}`}
                    >
                      {w.rejectionReason}
                    </p>
                  )}
                </div>

                {actionable && (
                  <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
                      onClick={() => setRejecting(w)}
                    >
                      <IconX />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="shadow-none"
                      onClick={() => setPaying(w)}
                    >
                      <IconCash />
                      Pay {formatFcfa(w.amount)}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
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

      <PayDialog withdrawal={paying} onClose={() => setPaying(null)} />
      <RejectDialog withdrawal={rejecting} onClose={() => setRejecting(null)} />
    </div>
  );
}
