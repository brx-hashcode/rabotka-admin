import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import {
  IconBell,
  IconBriefcase,
  IconCircleCheck,
  IconCircleX,
  IconEye,
  IconLockOpen,
  IconMessage,
  IconStar,
  IconTrendingUp,
} from "@tabler/icons-react";
import type { ComponentType } from "react";
import type { IconProps } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
  getProfileNotifications,
  type AdminProfileNotification,
} from "#/lib/api/profile-notifications-controller";
import { groupByDay } from "#/lib/date-grouping";
import { getNotificationStateBadgeClass } from "#/lib/status-labels";

const PAGE_SIZE = 30;

const TYPE_LABELS: Record<string, string> = {
  PROFILE_VIEW: "Profile view",
  JOB_RECOMMENDATION: "Job recommendation",
  APPLICATION_ACCEPTED: "Application accepted",
  APPLICATION_REJECTED: "Application rejected",
  HIRE_CANCELLED: "Hire cancelled",
  MISSION_RATED: "Rated",
  NEW_APPLICATION: "New application",
  APPLICATION_CANCELLED: "Application cancelled",
  MISSION_COMPLETED: "Mission completed",
  CONTACT_UNLOCKED: "Contact unlocked",
  PAYMENT_SUCCEEDED: "Payment succeeded",
  PAYMENT_FAILED: "Payment failed",
  CLAIM_COMMENTED: "Claim reply",
  CLAIM_STATUS_CHANGED: "Claim status changed",
  SIMILAR_PROFILE_HIRED: "Similar profile hired",
};

const TYPE_ICONS: Record<string, ComponentType<IconProps>> = {
  PROFILE_VIEW: IconEye,
  JOB_RECOMMENDATION: IconBriefcase,
  APPLICATION_ACCEPTED: IconBriefcase,
  APPLICATION_REJECTED: IconBriefcase,
  HIRE_CANCELLED: IconBriefcase,
  NEW_APPLICATION: IconBriefcase,
  APPLICATION_CANCELLED: IconBriefcase,
  MISSION_COMPLETED: IconBriefcase,
  MISSION_RATED: IconStar,
  CONTACT_UNLOCKED: IconLockOpen,
  PAYMENT_SUCCEEDED: IconCircleCheck,
  PAYMENT_FAILED: IconCircleX,
  CLAIM_COMMENTED: IconMessage,
  CLAIM_STATUS_CHANGED: IconMessage,
  SIMILAR_PROFILE_HIRED: IconTrendingUp,
};

/** Whose action it was, in the admin's words — the actor can be either role. */
const ACTOR_PREFIX: Record<string, string> = {
  PROFILE_VIEW: "viewed by",
  MISSION_RATED: "from",
};

function NotificationRow({
  notification,
}: Readonly<{ notification: AdminProfileNotification }>) {
  const Icon = TYPE_ICONS[notification.type] ?? IconBell;
  const date = new Date(notification.createdAt);
  const valid = !Number.isNaN(date.getTime());
  const { actor } = notification;

  return (
    <div className="flex items-start gap-3 px-6 py-3">
      {/* Same leading visual as the profile's own bell: the actor's photo when
          there is one, the type icon otherwise. */}
      <Avatar className="size-9 shrink-0">
        {notification.actorAvatarUrl && (
          <AvatarImage
            src={notification.actorAvatarUrl}
            alt=""
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {TYPE_LABELS[notification.type] ?? notification.type}
          {actor && (
            <>
              <span className="text-muted-foreground font-normal">
                {" "}
                {ACTOR_PREFIX[notification.type] ?? "·"}{" "}
              </span>
              <Link
                to="/profiles/$profileId"
                params={{ profileId: actor.profileId }}
                className="hover:underline"
              >
                {actor.firstName} {actor.lastName}
              </Link>
            </>
          )}
        </p>
        {/* Exactly what the profile read — the actor above is admin-only. */}
        <p className="text-muted-foreground text-sm">{notification.body}</p>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
          {valid && <span>{format(date, "HH:mm")}</span>}
          {valid && <span aria-hidden>·</span>}
          {valid && (
            <span title={format(date, "PPpp")}>
              {formatDistanceToNow(date, { addSuffix: true })}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge
          className={`text-xs ${getNotificationStateBadgeClass(
            notification.readAt ? "READ" : "UNREAD",
          )}`}
          title={
            notification.readAt
              ? `Read ${format(new Date(notification.readAt), "PPpp")}`
              : undefined
          }
        >
          {notification.readAt ? "Read" : "Unread"}
        </Badge>
        {/* Cleared from the profile's own feed — kept here for support. */}
        {notification.dismissedAt && (
          <Badge
            className={`text-xs ${getNotificationStateBadgeClass("DISMISSED")}`}
            title={`Cleared ${format(new Date(notification.dismissedAt), "PPpp")}`}
          >
            Dismissed
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * The profile's in-app notification feed — what their bell shows — with the
 * actor behind each entry, which the profile never sees.
 */
export function ProfileNotificationsContent({
  profileId,
}: Readonly<{ profileId: string }>) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["admin", "profiles", profileId, "notifications"],
      queryFn: ({ pageParam }) =>
        getProfileNotifications(profileId, pageParam, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.reduce((n, p) => n + p.data.length, 0);
        return loaded < lastPage.total ? allPages.length + 1 : undefined;
      },
    });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={`notification-skeleton-${i + 1}`}
            className="h-16 w-full rounded-xl"
          />
        ))}
      </div>
    );
  }

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];
  const first = data?.pages[0];
  const groups = groupByDay(notifications, (n) => n.createdAt);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
        {first && first.total > 0 && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {first.total} · {first.unreadCount} unread
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconBell className="text-muted-foreground mb-2 size-8" />
            <p className="text-muted-foreground text-sm">
              No notifications for this profile yet.
            </p>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <section key={group.key}>
                <div className="bg-muted/40 text-muted-foreground sticky top-0 z-10 px-6 py-1.5 text-xs font-medium">
                  {group.heading}
                </div>
                <div className="divide-y">
                  {group.items.map((n) => (
                    <NotificationRow key={n.id} notification={n} />
                  ))}
                </div>
              </section>
            ))}
            {hasNextPage && (
              <div className="px-6 py-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
