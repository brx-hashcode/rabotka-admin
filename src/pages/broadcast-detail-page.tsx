import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
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
import { friendlyError } from "#/lib/api/friendly-error";
import {
  cancelBroadcast,
  getBroadcastById,
  getBroadcastRecipients,
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

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "broadcasts"] });

  const sendNow = useMutation({
    mutationFn: () => sendBroadcast(broadcastId),
    onSuccess: async (result) => {
      toast.success(`Sending to ${fmt(result.recipientCount)} deliveries`);
      await invalidate();
    },
    onError: (err) => toast.error(friendlyError(err, "The broadcast was not sent")),
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
        </div>
      </div>

      <Counters broadcast={broadcast} />

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
                  <span className="truncate">
                    {recipient.profile.first_name} {recipient.profile.last_name}
                  </span>
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
