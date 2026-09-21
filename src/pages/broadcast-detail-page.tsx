import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageListHeader } from "#/components/page-list-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { BROADCAST_STATUS_LABELS } from "#/features/broadcasts/components/broadcast-columns";
import { DeliveryChart } from "#/features/broadcasts/components/delivery-chart";
import { friendlyError } from "#/lib/api/friendly-error";
import {
  cancelBroadcast,
  getBroadcastById,
  getBroadcastRecipients,
  retryBroadcast,
  sendBroadcast,
  type Broadcast,
  type RecipientStatus,
} from "#/lib/api/broadcasts-controller";
import { useRole } from "#/hooks/use-role";

const fmt = (n: number) => n.toLocaleString("fr-FR");

const RECIPIENT_STATUS_LABELS: Record<RecipientStatus, string> = {
  PENDING: "Pending",
  SENT: "Sent",
  FAILED: "Failed",
  READ: "Read",
};

export default function BroadcastDetailPage() {
  const { broadcastId } = useParams({
    from: "/_authenticated/broadcasts/$broadcastId",
  });
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const [cancelling, setCancelling] = useState(false);

  const { data: broadcast, isLoading } = useQuery({
    queryKey: ["admin", "broadcasts", broadcastId],
    queryFn: () => getBroadcastById(broadcastId),
    // The counters move in the worker, not here, so an in-flight send needs a
    // poll or the page lies until it is reloaded.
    refetchInterval: (q) =>
      q.state.data?.status === "SENDING" || q.state.data?.status === "SCHEDULED"
        ? 5_000
        : false,
  });

  const { data: recipients } = useQuery({
    queryKey: ["admin", "broadcasts", broadcastId, "recipients"],
    queryFn: () => getBroadcastRecipients(broadcastId, { page: 1, limit: 50 }),
    enabled: Boolean(broadcast && broadcast.recipient_count > 0),
  });

  /**
   * Refresh everything this page shows.
   *
   * The list key is a prefix of the detail and stats keys, so one invalidation
   * covers all three — but `refetchType: "all"` is what makes the inactive
   * ones (the chart, while it is not polling) actually re-fetch rather than
   * merely being marked stale.
   */
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["admin", "broadcasts"],
      refetchType: "all",
    });

  const sendNow = useMutation({
    mutationFn: () => sendBroadcast(broadcastId),
    onSuccess: async (result) => {
      toast.success(`Sending to ${fmt(result.recipientCount)} deliveries`);
      await invalidate();
    },
    onError: (err) => toast.error(friendlyError(err, "The broadcast was not sent")),
  });

  /**
   * Re-queues only the failed rows, each on its own channel.
   *
   * Worth its own button rather than "send again": sending again would message
   * everyone who already received it, which on WhatsApp is both a second bill
   * and a second interruption.
   */
  const retry = useMutation({
    mutationFn: () => retryBroadcast(broadcastId),
    onSuccess: async (result) => {
      toast.success(
        `Retrying ${fmt(result.retried)} failed deliver${result.retried === 1 ? "y" : "ies"}`,
      );
      await invalidate();
    },
    onError: (err) =>
      toast.error(friendlyError(err, "The retry could not be queued")),
  });

  const stop = useMutation({
    mutationFn: () => cancelBroadcast(broadcastId),
    onSuccess: async () => {
      toast.success("Cancelled — it stops at the next batch");
      await invalidate();
    },
    onError: (err) => toast.error(friendlyError(err, "The broadcast was not cancelled")),
    onSettled: () => setCancelling(false),
  });

  if (isLoading || !broadcast) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const canSend = broadcast.status === "DRAFT";
  const canStop =
    broadcast.status === "SENDING" || broadcast.status === "SCHEDULED";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <PageListHeader
          title={broadcast.title}
          description={`Created ${new Date(broadcast.created_at).toLocaleDateString("fr-FR")}`}
        />
        <div className="flex items-center gap-2">
          <Badge>{BROADCAST_STATUS_LABELS[broadcast.status]}</Badge>
          {canSend && canManageContent ? (
            <Button
              disabled={sendNow.isPending}
              onClick={() => sendNow.mutate()}
            >
              Send now
            </Button>
          ) : null}
          {canStop && canManageContent ? (
            <Button variant="ghost" onClick={() => setCancelling(true)}>
              Cancel
            </Button>
          ) : null}
          {broadcast.failed_count > 0 && !canStop && canManageContent ? (
            <Button
              variant="outline"
              disabled={retry.isPending}
              onClick={() => retry.mutate()}
            >
              {retry.isPending
                ? "Retrying…"
                : `Retry ${fmt(broadcast.failed_count)} failed`}
            </Button>
          ) : null}
        </div>
      </div>

      <Counters broadcast={broadcast} />

      {broadcast.recipient_count > 0 ? (
        <DeliveryChart broadcastId={broadcastId} live={canStop} />
      ) : null}

      <section className="bg-card shadow-soft space-y-2 rounded-lg p-4">
        <h2 className="text-sm font-medium">Message</h2>
        <p className="whitespace-pre-line text-sm">{broadcast.body}</p>
        {broadcast.link ? (
          <p className="text-muted-foreground text-xs">
            Opens <span className="font-mono">/{broadcast.link}</span>
          </p>
        ) : null}
      </section>

      <section className="bg-card shadow-soft space-y-3 rounded-lg p-4">
        <h2 className="text-sm font-medium">Recipients</h2>
        {recipients && recipients.data.length > 0 ? (
          <>
            <ul className="divide-border/40 divide-y text-sm">
              {recipients.data.map((recipient) => (
                <li
                  key={recipient.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  {/* The name is the way into the profile: a delivery that
                      failed is almost always a question about the person —
                      wrong number, suspended account — and retyping their name
                      into the profiles search is the long way round. */}
                  <Link
                    to="/profiles/$profileId"
                    params={{ profileId: recipient.profile.id }}
                    className="truncate font-medium hover:underline"
                  >
                    {recipient.profile.first_name} {recipient.profile.last_name}
                  </Link>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {recipient.channel.toLowerCase().replace("_", "-")} ·{" "}
                    {RECIPIENT_STATUS_LABELS[recipient.status]}
                    {recipient.error ? ` · ${recipient.error}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            {recipients.total > recipients.data.length ? (
              <p className="text-muted-foreground text-xs">
                Showing {recipients.data.length} of {fmt(recipients.total)}{" "}
                deliveries.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No deliveries yet. The audience is frozen when the broadcast is
            sent.
          </p>
        )}
      </section>

      <AlertDialog open={cancelling} onOpenChange={setCancelling}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop this broadcast?</AlertDialogTitle>
            <AlertDialogDescription>
              It stops at the next batch. Messages already delivered stay
              delivered — WhatsApp has no unsend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep sending</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                stop.mutate();
              }}
            >
              Stop it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Counters({ broadcast }: Readonly<{ broadcast: Broadcast }>) {
  const cells = [
    { label: "Recipients", value: fmt(broadcast.recipient_count) },
    { label: "Sent", value: fmt(broadcast.sent_count) },
    { label: "Failed", value: fmt(broadcast.failed_count) },
    { label: "Read", value: fmt(broadcast.read_count) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label} className="bg-card shadow-soft rounded-lg p-4">
          <p className="text-muted-foreground text-xs">{cell.label}</p>
          <p className="text-2xl font-semibold tabular-nums">{cell.value}</p>
        </div>
      ))}
    </div>
  );
}
