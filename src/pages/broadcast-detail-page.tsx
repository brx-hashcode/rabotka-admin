import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  BellRing,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleStop,
  Inbox,
  MailCheck,
  RotateCcw,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
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
import {
  BROADCAST_STATUS_LABELS,
  CHANNEL_ICONS,
  CHANNEL_LABELS,
  audienceLabel,
  formatDate,
} from "#/features/broadcasts/components/broadcast-columns";
import {
  DeliveryBreakdown,
  STATUS_STYLE,
} from "#/features/broadcasts/components/delivery-chart";
import { MessagePreview } from "#/features/broadcasts/components/message-preview";
import { friendlyError } from "#/lib/api/friendly-error";
import { formatSchedule } from "#/lib/broadcast-schedule";
import {
  cancelBroadcast,
  getBroadcastById,
  getBroadcastRecipients,
  getBroadcastStats,
  retryBroadcast,
  sendBroadcast,
  type Broadcast,
  type BroadcastChannel,
  type BroadcastStats,
  type BroadcastStatus,
  type RecipientStatus,
} from "#/lib/api/broadcasts-controller";
import { useRole } from "#/hooks/use-role";
import { getInitials } from "#/lib/utils";

const fmt = (n: number) => n.toLocaleString("fr-FR");

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

  const live =
    broadcast?.status === "SENDING" || broadcast?.status === "SCHEDULED";
  const stats = useQuery({
    queryKey: ["admin", "broadcasts", broadcastId, "stats"],
    queryFn: () => getBroadcastStats(broadcastId),
    enabled: Boolean(broadcast && broadcast.recipient_count > 0),
    // Driven by the broadcast's state: the numbers move while it is out.
    refetchInterval: live ? 5_000 : false,
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

  if (isLoading || !broadcast) return <DetailSkeleton />;

  const canSend = broadcast.status === "DRAFT";
  const canStop =
    broadcast.status === "SENDING" || broadcast.status === "SCHEDULED";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          to="/broadcasts"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Broadcasts
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {broadcast.title}
              </h1>
              <Badge variant={STATUS_VARIANT[broadcast.status]} className="gap-1.5">
                {broadcast.status === "SENDING" ? (
                  <span className="size-1.5 animate-pulse rounded-full bg-current" />
                ) : null}
                {BROADCAST_STATUS_LABELS[broadcast.status]}
              </Badge>
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="flex flex-wrap gap-1">
                {broadcast.channels.map((c) => {
                  const Icon = CHANNEL_ICONS[c] ?? Bell;
                  return (
                    <Badge key={c} variant="outline" className="gap-1 font-normal">
                      <Icon className="size-3" />
                      {CHANNEL_LABELS[c] ?? c}
                    </Badge>
                  );
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" />
                {audienceLabel(broadcast)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4" />
                {when(broadcast)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canSend && canManageContent ? (
              <Button disabled={sendNow.isPending} onClick={() => sendNow.mutate()}>
                <Send className="size-4" />
                Send now
              </Button>
            ) : null}
            {canStop && canManageContent ? (
              <Button variant="outline" onClick={() => setCancelling(true)}>
                <CircleStop className="size-4" />
                {broadcast.status === "SCHEDULED" ? "Cancel" : "Stop"}
              </Button>
            ) : null}
            {broadcast.failed_count > 0 && !canStop && canManageContent ? (
              <Button
                variant="outline"
                disabled={retry.isPending}
                onClick={() => retry.mutate()}
              >
                <RotateCcw className="size-4" />
                {retry.isPending
                  ? "Retrying…"
                  : `Retry ${fmt(broadcast.failed_count)} failed`}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <StatTiles broadcast={broadcast} stats={stats.data} />

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <DeliveryBreakdown
            stats={stats.data}
            isLoading={stats.isLoading && broadcast.recipient_count > 0}
          />
          <RecipientsCard broadcast={broadcast} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message</CardTitle>
              <p className="text-muted-foreground text-xs">
                As each channel shows it.
              </p>
            </CardHeader>
            <CardContent>
              <MessagePreview
                bare
                title={broadcast.title}
                body={broadcast.body}
                link={broadcast.link ?? ""}
                channels={broadcast.channels}
              />
            </CardContent>
          </Card>
          <AudienceCard broadcast={broadcast} />
        </div>
      </div>

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

const STATUS_VARIANT: Record<
  BroadcastStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  SENDING: "default",
  SENT: "default",
  CANCELLED: "secondary",
  FAILED: "destructive",
};

/** « Sent on … », « Scheduled for … » or « Created on … », whichever applies. */
function when(b: Broadcast): string {
  if (b.status === "SCHEDULED" && b.scheduled_at) {
    return `Scheduled for ${formatSchedule(b.scheduled_at)}`;
  }
  if (b.sent_at) return `Sent ${formatDate(b.sent_at)}`;
  return `Created ${formatDate(b.created_at)}`;
}

const pct = (part: number, whole: number) =>
  whole === 0 ? null : Math.round((part / whole) * 100);

function Tile({
  label,
  icon: Icon,
  value,
  note,
  tone,
  bar,
}: Readonly<{
  label: string;
  icon: React.ElementType;
  value: React.ReactNode;
  note: string;
  tone?: "danger";
  bar?: { value: number; color: string };
}>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {label}
        </CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent className="space-y-2">
        <p
          className={
            tone === "danger"
              ? "text-destructive text-2xl font-bold tabular-nums"
              : "text-2xl font-bold tabular-nums"
          }
        >
          {value}
        </p>
        {bar ? (
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full"
              style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
            />
          </div>
        ) : null}
        <p className="text-muted-foreground text-xs">{note}</p>
      </CardContent>
    </Card>
  );
}

function StatTiles({
  broadcast: b,
  stats,
}: Readonly<{ broadcast: Broadcast; stats: BroadcastStats | undefined }>) {
  const inApp = (stats?.byChannel ?? [])
    .filter((s) => s.channel === "IN_APP" && (s.status === "SENT" || s.status === "READ"))
    .reduce((n, s) => n + s.count, 0);
  const people = new Set(b.channels).size;
  const delivered = pct(b.sent_count, b.recipient_count);
  const failed = pct(b.failed_count, b.recipient_count);
  const read = pct(b.read_count, inApp);
  const pending = Math.max(b.recipient_count - b.sent_count - b.failed_count, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        label="Messages"
        icon={Inbox}
        value={fmt(b.recipient_count)}
        note={
          b.recipient_count === 0
            ? "The audience is frozen when it is sent"
            : people > 1
              ? `Across ${people} channels`
              : `On ${CHANNEL_LABELS[b.channels[0]] ?? "one channel"}`
        }
      />
      <Tile
        label="Delivered"
        icon={MailCheck}
        value={
          <>
            {fmt(b.sent_count)}
            <span className="text-muted-foreground text-base font-medium">
              {" "}
              / {fmt(b.recipient_count)}
            </span>
          </>
        }
        bar={
          delivered === null
            ? undefined
            : { value: delivered, color: STATUS_STYLE.SENT.color }
        }
        note={
          delivered === null
            ? "Nothing sent yet"
            : pending > 0
              ? `${delivered} % · ${fmt(pending)} still to go`
              : `${delivered} % of messages`
        }
      />
      <Tile
        label="Failed"
        icon={CircleAlert}
        tone={b.failed_count > 0 ? "danger" : undefined}
        value={fmt(b.failed_count)}
        note={
          b.failed_count === 0
            ? "Nothing failed"
            : `${failed} % · the reasons are in the list below`
        }
      />
      <Tile
        label="Read in-app"
        icon={BellRing}
        value={read === null ? "—" : `${read} %`}
        bar={read === null ? undefined : { value: read, color: STATUS_STYLE.READ.color }}
        note={
          b.channels.includes("IN_APP")
            ? `${fmt(b.read_count)} read of ${fmt(inApp)} delivered`
            : "In-app only reports reads"
        }
      />
    </div>
  );
}

const PROFILE_TYPE_LABEL: Record<string, string> = {
  WORKER: "Workers",
  EMPLOYER: "Employers",
};

/** The audience's filters, in words. */
function AudienceCard({ broadcast }: Readonly<{ broadcast: Broadcast }>) {
  const a = broadcast.audience ?? {};
  const rows: [string, string][] = [];
  rows.push([
    "Who",
    a.profile_types?.length
      ? a.profile_types.map((t) => PROFILE_TYPE_LABEL[t] ?? t).join(", ")
      : "Everyone",
  ]);
  if (a.statuses?.length) rows.push(["Account", a.statuses.join(", ").toLowerCase()]);
  if (a.verification_statuses?.length)
    rows.push(["Verification", a.verification_statuses.join(", ").toLowerCase()]);
  if (a.country_codes?.length) rows.push(["Countries", a.country_codes.join(", ")]);
  if (a.cities?.length) rows.push(["Cities", a.cities.join(", ")]);
  if (a.category_ids?.length)
    rows.push(["Trades", `${a.category_ids.length} selected`]);
  if (a.active_within_days != null)
    rows.push(["Active", `Signed in within ${a.active_within_days} days`]);
  if (a.created_from || a.created_to)
    rows.push([
      "Signed up",
      [
        a.created_from ? `from ${new Date(a.created_from).toLocaleDateString("fr-FR")}` : "",
        a.created_to ? `to ${new Date(a.created_to).toLocaleDateString("fr-FR")}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    ]);
  if (a.has_email != null) rows.push(["Email", a.has_email ? "Has one" : "Has none"]);
  if (a.whatsapp_connected != null)
    rows.push(["WhatsApp", a.whatsapp_connected ? "Connected" : "Not connected"]);
  if (a.include_profile_ids?.length)
    rows.push(["Added by hand", `${a.include_profile_ids.length} profile(s)`]);
  if (a.exclude_profile_ids?.length)
    rows.push(["Left out", `${a.exclude_profile_ids.length} profile(s)`]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audience</CardTitle>
        <p className="text-muted-foreground text-xs">
          Opted-out and deleted profiles are always left out.
        </p>
      </CardHeader>
      <CardContent>
        <dl className="divide-border divide-y text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

const RECIPIENT_STATUS_LABELS: Record<RecipientStatus, string> = {
  PENDING: "Pending",
  SENT: "Delivered",
  FAILED: "Failed",
  READ: "Read",
};

const RECIPIENT_STATUS_CLASS: Record<RecipientStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  SENT: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  FAILED: "bg-destructive/15 text-destructive",
  READ: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

const PAGE_SIZE = 20;

/** Who received it, on which channel, and what happened: paged and filterable. */
function RecipientsCard({ broadcast }: Readonly<{ broadcast: Broadcast }>) {
  const [channel, setChannel] = useState<BroadcastChannel | "ALL">("ALL");
  const [failedOnly, setFailedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const live =
    broadcast.status === "SENDING" || broadcast.status === "SCHEDULED";

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "broadcasts",
      broadcast.id,
      "recipients",
      { channel, failedOnly, page },
    ],
    queryFn: () =>
      getBroadcastRecipients(broadcast.id, {
        page,
        limit: PAGE_SIZE,
        ...(channel === "ALL" ? {} : { channel }),
        ...(failedOnly ? { status: "FAILED" as const } : {}),
      }),
    enabled: broadcast.recipient_count > 0,
    placeholderData: keepPreviousData,
    refetchInterval: live ? 5_000 : false,
  });

  const total = data?.total ?? 0;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const choose = (next: () => void) => {
    next();
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Recipients</CardTitle>
            <p className="text-muted-foreground text-xs">
              {fmt(total)} deliver{total === 1 ? "y" : "ies"}
              {failedOnly ? " failed" : ""}
            </p>
          </div>
          {broadcast.failed_count > 0 ? (
            <Button
              size="sm"
              variant={failedOnly ? "destructive" : "outline"}
              onClick={() => choose(() => setFailedOnly((v) => !v))}
            >
              <CircleAlert className="size-4" />
              Failed only ({fmt(broadcast.failed_count)})
            </Button>
          ) : null}
        </div>
        {broadcast.channels.length > 1 ? (
          <Tabs
            value={channel}
            onValueChange={(v) => choose(() => setChannel(v as BroadcastChannel | "ALL"))}
          >
            <TabsList variant="line">
              <TabsTrigger value="ALL">All</TabsTrigger>
              {broadcast.channels.map((c) => (
                <TabsTrigger key={c} value={c}>
                  {CHANNEL_LABELS[c] ?? c}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}
      </CardHeader>
      <CardContent>
        {broadcast.recipient_count === 0 ? (
          <p className="text-muted-foreground text-sm">
            No deliveries yet. The audience is frozen when the broadcast is
            sent.
          </p>
        ) : isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : (data?.data.length ?? 0) === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Nobody here.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((r) => {
                  const name = `${r.profile.first_name} ${r.profile.last_name}`.trim();
                  const Icon = CHANNEL_ICONS[r.channel] ?? Bell;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        {/* The name is the way into the profile: a failed
                            delivery is almost always a question about the
                            person. */}
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            {r.profile.avatar_url ? (
                              <AvatarImage src={r.profile.avatar_url} alt={name} />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              to="/profiles/$profileId"
                              params={{ profileId: r.profile.id }}
                              className="block truncate font-medium hover:underline"
                            >
                              {name}
                            </Link>
                            <p className="text-muted-foreground truncate text-xs">
                              {r.channel === "EMAIL"
                                ? (r.profile.email ?? "—")
                                : r.channel === "WHATSAPP"
                                  ? r.profile.phone
                                  : "Notification feed"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
                          <Icon className="size-3.5" />
                          {CHANNEL_LABELS[r.channel] ?? r.channel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RECIPIENT_STATUS_CLASS[r.status]}`}
                        >
                          {RECIPIENT_STATUS_LABELS[r.status]}
                        </span>
                        {r.error ? (
                          <p
                            className="text-destructive mt-1 max-w-xs truncate text-xs"
                            title={r.error}
                          >
                            {r.error}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right text-xs">
                        {r.sent_at ? formatDate(r.sent_at) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {pages > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-4">
                <p className="text-muted-foreground text-xs">
                  Page {page} of {pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
