import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCrown,
  IconDots,
  IconExternalLink,
  IconMail,
  IconPhotoOff,
  IconPlugConnectedX,
  IconSend,
  IconTrendingDown,
  IconTrendingUp,
  IconUserMinus,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "#/components/ui/dropdown-menu";
import { Skeleton } from "#/components/ui/skeleton";
import { Switch } from "#/components/ui/switch";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import { useRole } from "#/hooks/use-role";
import {
  adminBusinessKey,
  disconnectBusinessMailbox,
  getBusinessActivity,
  getBusinessCareers,
  getBusinessMailboxes,
  getBusinessOverview,
  getBusinessTeam,
  removeBusinessMember,
  removeCareersCover,
  removeCareersPhoto,
  resendBusinessInvite,
  ROLE_LABEL,
  setBusinessDistribution,
  type BusinessMailbox,
  type BusinessTeamMember,
} from "#/lib/api/admin-business-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { activityLabel, activityOfferId } from "../business-activity-labels";
import { formatDate, formatDateTime } from "../helpers";
import { CareersApplicationsTable } from "#/features/careers-applications/careers-applications-table";

function Loading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function Failed({ error }: Readonly<{ error: unknown }>) {
  return <p className="text-destructive text-sm">{friendlyError(error, "Could not load this section.")}</p>;
}

const STATUS_BADGE: Record<BusinessTeamMember["status"], string> = {
  ACTIVE: "bg-green-500/15 text-green-700 dark:text-green-400",
  INVITED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  REMOVED: "bg-muted text-muted-foreground",
};

// ── Team ────────────────────────────────────────────────────────────────

/** Who works in the business's space, and the places its plan gives. */
export function BusinessTeamSection({ profileId }: Readonly<{ profileId: string }>) {
  const { canManageContent } = useRole();
  const queryClient = useQueryClient();
  const team = useQuery({ queryKey: adminBusinessKey(profileId, "team"), queryFn: () => getBusinessTeam(profileId) });
  const [removing, setRemoving] = useState<BusinessTeamMember | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: adminBusinessKey(profileId) });

  const resend = useMutation({
    mutationFn: (m: BusinessTeamMember) => resendBusinessInvite(profileId, m.id),
    onSuccess: (m) => toast.success(`Invitation sent again to ${m.email}`),
    onError: (err) => toast.error(friendlyError(err, "The invitation could not be sent.")),
  });
  const remove = useMutation({
    mutationFn: (m: BusinessTeamMember) => removeBusinessMember(profileId, m.id),
    onSuccess: () => {
      toast.success(`${removing?.name ?? "Member"} removed: their session stops now`);
      setRemoving(null);
      refresh();
    },
    onError: (err) => toast.error(friendlyError(err, "The member could not be removed.")),
  });

  if (team.isLoading) return <Loading />;
  if (!team.data) return <Failed error={team.error} />;
  const { members, seats } = team.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Members" value={String(members.filter((m) => m.status !== "REMOVED").length)} hint="Account holder included" />
        <Stat label="Recruiters" value={places(seats.RECRUITER)} hint="Places from the plan" />
        <Stat label="Reviewers" value={places(seats.REVIEWER)} hint="Places from the plan" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Team</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium text-sm">
                    {m.name}
                    {m.isOwner && <IconCrown className="size-4 text-amber-500" aria-label="Account holder" />}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {m.email}
                    {m.invitedBy && ` · invited by ${m.invitedBy}`}
                    {m.status === "INVITED" && m.invitedAt && ` · invited ${formatDateTime(m.invitedAt)}`}
                    {m.status === "ACTIVE" && ` · last seen ${m.lastSeenAt ? formatDateTime(m.lastSeenAt) : "—"}`}
                    {m.status === "REMOVED" && m.removedAt && ` · removed ${formatDate(m.removedAt)}`}
                  </p>
                </div>
                <Badge variant="outline">{m.isOwner ? "Account holder" : ROLE_LABEL[m.role]}</Badge>
                <Badge className={STATUS_BADGE[m.status]}>{m.status.toLowerCase()}</Badge>
                {canManageContent && !m.isOwner && m.status !== "REMOVED" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label={`Actions for ${m.name}`}>
                        <IconDots className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {m.status === "INVITED" && (
                        <DropdownMenuItem disabled={resend.isPending} onSelect={() => resend.mutate(m)}>
                          <IconSend className="size-4" />
                          Resend invitation
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onSelect={() => setRemoving(m)}>
                        <IconUserMinus className="size-4" />
                        Remove from team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="w-9" />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.name ?? ""} from the team?`}
        description="Their session stops on the next request. What they did stays (offers, decisions, notes). Logged in the admin log."
        actionLabel="Remove"
        variant="destructive"
        isPending={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing)}
      />
    </div>
  );
}

const places = (p: { used: number; limit: number | null }) => (p.limit === null ? `${p.used} / unlimited` : `${p.used} / ${p.limit}`);

// ── Activity ────────────────────────────────────────────────────────────

/** Who did what in the business's space, newest first. */
export function BusinessActivitySection({ profileId }: Readonly<{ profileId: string }>) {
  const team = useQuery({ queryKey: adminBusinessKey(profileId, "team"), queryFn: () => getBusinessTeam(profileId) });
  const [memberId, setMemberId] = useState<string | undefined>(undefined);
  const activity = useInfiniteQuery({
    queryKey: adminBusinessKey(profileId, "activity", memberId ?? "all"),
    queryFn: ({ pageParam }) => getBusinessActivity(profileId, { page: pageParam, memberId }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
  const items = activity.data?.pages.flatMap((p) => p.items) ?? [];
  const people = (team.data?.members ?? []).filter((m) => m.status !== "INVITED");

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm">
          Activity {activity.data && <span className="font-normal text-muted-foreground">({activity.data.pages[0]?.total ?? 0})</span>}
        </CardTitle>
        {people.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {[{ id: undefined as string | undefined, name: "Everyone" }, ...people].map((p) => (
              <Button key={p.id ?? "all"} size="sm" variant={memberId === p.id ? "default" : "outline"} onClick={() => setMemberId(p.id)}>
                {p.name}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {activity.isLoading ? (
          <div className="p-6">
            <Loading />
          </div>
        ) : activity.isError ? (
          <div className="p-6">
            <Failed error={activity.error} />
          </div>
        ) : items.length === 0 ? (
          <p className="p-6 text-muted-foreground text-sm">Nothing yet.</p>
        ) : (
          <ul className="divide-y">
            {items.map((it) => {
              const offerId = activityOfferId(it.action, it.targetId);
              return (
                <li key={it.id} className="flex items-center gap-3 px-6 py-2.5 text-sm">
                  <p className="min-w-0 flex-1 truncate" title={it.action}>
                    <span className="font-medium">{it.member?.name ?? "A former member"}</span>{" "}
                    {it.member && <span className="text-muted-foreground text-xs">({ROLE_LABEL[it.member.role]})</span>}{" "}
                    {activityLabel(it.action)}
                    {offerId && (
                      <>
                        {" · "}
                        <Link to="/jobs/$jobId" params={{ jobId: offerId }} className="font-medium hover:underline">
                          open offer
                        </Link>
                      </>
                    )}
                  </p>
                  <span className="shrink-0 text-muted-foreground text-xs">{formatDateTime(it.at)}</span>
                </li>
              );
            })}
          </ul>
        )}
        {activity.hasNextPage && (
          <div className="border-t p-3 text-center">
            <Button size="sm" variant="outline" onClick={() => void activity.fetchNextPage()} disabled={activity.isFetchingNextPage}>
              Load more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Hiring ──────────────────────────────────────────────────────────────

/** The business dashboard's figures, as the business sees them. */
export function BusinessHiringSection({ profileId }: Readonly<{ profileId: string }>) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const overview = useQuery({
    queryKey: adminBusinessKey(profileId, "overview", days),
    queryFn: () => getBusinessOverview(profileId, days),
  });
  const o = overview.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-1">
        {([7, 30, 90] as const).map((d) => (
          <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
            {d} days
          </Button>
        ))}
      </div>
      {overview.isLoading ? (
        <Loading />
      ) : !o ? (
        <Failed error={overview.error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Candidates received" value={String(o.applications.received)} previous={o.applications.receivedPrevious} now={o.applications.received} />
            <Stat label="Hires" value={String(o.hires.count)} previous={o.hires.previous} now={o.hires.count} />
            <Stat label="Offers published" value={String(o.offers.published)} previous={o.offers.publishedPrevious} now={o.offers.published} hint={`${o.offers.open} open now`} />
            <Stat
              label="Time to hire"
              value={o.timing.timeToHireDays === null ? "—" : `${o.timing.timeToHireDays} d`}
              hint={`${o.applications.toReview} to review · ${o.applications.overdue} overdue`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm">Offers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {o.topOffers.length === 0 ? (
                  <p className="px-6 pb-6 text-muted-foreground text-sm">No offer in this period.</p>
                ) : (
                  <ul className="divide-y">
                    {o.topOffers.map((offer) => (
                      <li key={offer.id} className="flex items-center gap-3 px-6 py-2.5 text-sm">
                        <Link to="/jobs/$jobId" params={{ jobId: offer.id }} className="min-w-0 flex-1 truncate font-medium hover:underline">
                          {offer.title}
                        </Link>
                        <span className="shrink-0 text-muted-foreground text-xs">
                          {offer.applications} candidates · {offer.hired}/{offer.quantity} hired
                        </span>
                        <Badge variant="outline">{offer.status.toLowerCase().replace("_", " ")}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Where candidates come from</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(o.sources ?? []).length === 0 ? (
                  <p className="text-muted-foreground">No candidate in this period.</p>
                ) : (
                  o.sources!.map((s) => (
                    <div key={s.source} className="flex items-center justify-between gap-2">
                      <span className="capitalize">{s.source}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {s.received} received · {s.hired} hired
                      </span>
                    </div>
                  ))
                )}
                <p className="pt-2 text-muted-foreground text-xs">Contacts unlocked: {o.contacts.unlocked}</p>
              </CardContent>
            </Card>
          </div>
          <CareersApplicationsTable employerId={profileId} title="Its careers page applications" />
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  previous,
  now,
}: Readonly<{ label: string; value: string; hint?: string; previous?: number; now?: number }>) {
  const trend = previous !== undefined && now !== undefined && now !== previous ? (now > previous ? "up" : "down") : null;
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="flex items-center gap-2 font-semibold text-2xl tabular-nums">
          {value}
          {trend === "up" && <IconTrendingUp className="size-4 text-green-600" aria-label={`Up from ${previous}`} />}
          {trend === "down" && <IconTrendingDown className="size-4 text-destructive" aria-label={`Down from ${previous}`} />}
        </p>
        {(hint || previous !== undefined) && (
          <p className="text-muted-foreground text-xs">{hint ?? `Previous period: ${previous}`}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Careers page & mailboxes ────────────────────────────────────────────

/** The public careers page (with moderation) and the connected mailboxes. */
export function BusinessCareersSection({ profileId }: Readonly<{ profileId: string }>) {
  const { canManageContent } = useRole();
  const queryClient = useQueryClient();
  const careersKey = adminBusinessKey(profileId, "careers");
  const careers = useQuery({ queryKey: careersKey, queryFn: () => getBusinessCareers(profileId) });
  const mailboxes = useQuery({ queryKey: adminBusinessKey(profileId, "mailboxes"), queryFn: () => getBusinessMailboxes(profileId) });
  const [confirm, setConfirm] = useState<
    | { kind: "photo"; index: number }
    | { kind: "cover" }
    | { kind: "distribution"; on: boolean }
    | { kind: "mailbox"; box: BusinessMailbox }
    | null
  >(null);

  const act = useMutation({
    mutationFn: async () => {
      if (!confirm) return;
      if (confirm.kind === "photo") return removeCareersPhoto(profileId, confirm.index);
      if (confirm.kind === "cover") return removeCareersCover(profileId);
      if (confirm.kind === "distribution") return setBusinessDistribution(profileId, confirm.on);
      await disconnectBusinessMailbox(profileId, confirm.box.id);
    },
    onSuccess: () => {
      toast.success("Done — recorded in the admin log");
      setConfirm(null);
      void queryClient.invalidateQueries({ queryKey: adminBusinessKey(profileId) });
    },
    onError: (err) => toast.error(friendlyError(err, "That did not work.")),
  });

  if (careers.isLoading) return <Loading />;
  if (!careers.data) return <Failed error={careers.error} />;
  const c = careers.data;

  const dialog =
    confirm?.kind === "photo"
      ? { title: "Take this photo down?", text: "It disappears from the business's careers page.", label: "Take down" }
      : confirm?.kind === "cover"
        ? { title: "Take the cover down?", text: "The careers page shows its default banner instead.", label: "Take down" }
        : confirm?.kind === "distribution"
          ? confirm.on
            ? { title: "Turn distribution on?", text: "Its open offers go to Google and the job sites again.", label: "Turn on" }
            : { title: "Turn distribution off?", text: "Its offers leave Google and the job sites; the careers page stays reachable by link.", label: "Turn off" }
          : confirm?.kind === "mailbox"
            ? {
                title: `Disconnect ${confirm.box.email}?`,
                text: "Rabotka's access to this mailbox is revoked; the business can connect it again.",
                label: "Disconnect",
              }
            : null;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Careers page</CardTitle>
          {c.url && c.live && (
            <a href={c.url} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm", variant: "outline" })}>
              <IconExternalLink className="size-4" />
              Open page
            </a>
          )}
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {!c.live && <p className="text-muted-foreground">Not reachable yet: the business is not verified.</p>}
          <div className="flex items-center justify-between gap-4 rounded border p-3">
            <div>
              <p className="font-medium">Distribution to Google and job sites</p>
              <p className="text-muted-foreground text-xs">{c.openOffers} open offer(s)</p>
            </div>
            <Switch
              checked={c.distributeOffers}
              disabled={!canManageContent}
              onCheckedChange={(on) => setConfirm({ kind: "distribution", on })}
              aria-label="Distribution"
            />
          </div>

          <div className="space-y-2">
            <p className="font-medium">Cover</p>
            {c.coverUrl ? (
              <Media src={c.coverUrl} wide onRemove={canManageContent ? () => setConfirm({ kind: "cover" }) : undefined} />
            ) : (
              <p className="text-muted-foreground">None.</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-medium">Photos ({c.photos.length})</p>
            {c.photos.length === 0 ? (
              <p className="text-muted-foreground">None.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {c.photos.map((src, i) => (
                  <Media key={src} src={src} onRemove={canManageContent ? () => setConfirm({ kind: "photo", index: i }) : undefined} />
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-medium">Benefits</p>
            {c.benefits.length === 0 ? (
              <p className="text-muted-foreground">None.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {c.benefits.map((b) => (
                  <Badge key={b} variant="outline">
                    {b}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Connected mailboxes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {mailboxes.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (mailboxes.data ?? []).length === 0 ? (
            <p className="text-muted-foreground">No mailbox connected.</p>
          ) : (
            mailboxes.data!.map((box) => (
              <div key={box.id} className="flex items-center gap-3 rounded border p-3">
                <IconMail className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{box.email}</p>
                  <p className="text-muted-foreground text-xs">
                    {box.provider} · since {formatDate(box.connectedAt)}
                    {box.expired && " · needs reconnecting"}
                  </p>
                </div>
                {canManageContent && (
                  <Button size="sm" variant="outline" onClick={() => setConfirm({ kind: "mailbox", box })}>
                    <IconPlugConnectedX className="size-4" />
                    Disconnect
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={dialog?.title ?? ""}
        description={dialog ? `${dialog.text} Logged in the admin log.` : ""}
        actionLabel={dialog?.label ?? "Confirm"}
        variant={confirm?.kind === "distribution" && confirm.on ? "default" : "destructive"}
        isPending={act.isPending}
        onConfirm={() => act.mutate()}
      />
    </div>
  );
}

function Media({ src, wide, onRemove }: Readonly<{ src: string; wide?: boolean; onRemove?: () => void }>) {
  return (
    <div className="group relative overflow-hidden rounded">
      <img src={src} alt="" className={wide ? "aspect-[4/1] w-full object-cover" : "aspect-[4/3] w-full object-cover"} />
      {onRemove && (
        <Button size="sm" variant="secondary" onClick={onRemove} className="absolute top-2 right-2 h-8 gap-1">
          <IconPhotoOff className="size-4" />
          Take down
        </Button>
      )}
    </div>
  );
}
