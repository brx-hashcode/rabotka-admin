import { useMemo } from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  IconShieldCheck,
  IconShieldX,
  IconUserCheck,
  IconEdit,
  IconCreditCard,
  IconClock,
  IconPhoto,
  IconSend,
  IconLink,
  IconCoin,
  IconCashBanknote,
  IconAlertTriangle,
} from "@tabler/icons-react";

import type { AdminLogEntry } from "#/lib/api/profiles-controller";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";

type Props = {
  logs: AdminLogEntry[];
  isLoading: boolean;
};

/**
 * Keyed by the action names the API actually writes.
 *
 * The previous map was keyed on names that no longer exist — `STATUS_CHANGED`
 * where the backend logs `PROFILE_STATUS_UPDATED`, and so on. Every real entry
 * therefore missed and fell through to the generic clock, which is why a
 * timeline of five different events rendered as five identical grey rows.
 */
const ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof IconShieldCheck; color: string }
> = {
  KYC_APPROVED: {
    label: "KYC approved",
    icon: IconShieldCheck,
    color: "text-emerald-500",
  },
  KYC_REJECTED: {
    label: "KYC rejected",
    icon: IconShieldX,
    color: "text-rose-500",
  },
  PROFILE_STATUS_UPDATED: {
    label: "Status changed",
    icon: IconUserCheck,
    color: "text-violet-500",
  },
  PROFILE_UPDATED: {
    label: "Profile updated",
    icon: IconEdit,
    color: "text-amber-500",
  },
  PROFILE_AVATAR_UPDATED: {
    label: "Avatar updated",
    icon: IconPhoto,
    color: "text-sky-500",
  },
  PROFILE_MESSAGE_SENT: {
    label: "Message sent",
    icon: IconSend,
    color: "text-sky-500",
  },
  PROFILE_VERIFICATION_LINK_SENT: {
    label: "Verification link sent",
    icon: IconLink,
    color: "text-sky-500",
  },
  WALLET_MANUAL_CREDIT: {
    label: "Wallet credited",
    icon: IconCoin,
    color: "text-teal-500",
  },
  WALLET_WITHDRAWAL_RECORDED: {
    label: "Withdrawal recorded",
    icon: IconCashBanknote,
    color: "text-teal-500",
  },
  PAYMENT_CONFIRMED: {
    label: "Payment confirmed",
    icon: IconCreditCard,
    color: "text-teal-500",
  },
  PAYMENT_FAILED: {
    label: "Payment failed",
    icon: IconAlertTriangle,
    color: "text-rose-500",
  },
};

/** Sentence case, so an unmapped action reads as text rather than shouting. */
function humanize(action: string): string {
  const words = action.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] ?? {
      label: humanize(action),
      icon: IconClock,
      color: "text-muted-foreground",
    }
  );
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

/**
 * "Today" / "Yesterday" / a date — the heading each group sits under.
 *
 * Five status changes in a row is the common shape here, and undated they read
 * as one event repeated. Grouping is what makes them a sequence.
 */
function dayHeading(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMMM yyyy");
}

function groupByDay(logs: AdminLogEntry[]) {
  const groups = new Map<string, { heading: string; logs: AdminLogEntry[] }>();
  for (const log of logs) {
    const date = new Date(log.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = format(date, "yyyy-MM-dd");
    const existing = groups.get(key);
    if (existing) {
      existing.logs.push(log);
    } else {
      groups.set(key, { heading: dayHeading(date), logs: [log] });
    }
  }
  return [...groups.values()];
}

/**
 * The detail that makes an entry worth reading.
 *
 * Every branch is keyed on an action name the API actually emits. The old
 * `PROFILE_UPDATED` branch returned an empty string rather than a node, which
 * React renders as nothing — the work it did to collect changed field names was
 * discarded. It now lists them, which is the only thing that distinguishes one
 * "Profile updated" from the next.
 */
type Meta = Record<string, unknown>;

const Note = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <p className="bg-muted text-muted-foreground mt-1.5 rounded p-1.5 text-xs">
    {children}
  </p>
);

/** One renderer per action, so adding a case never grows a branch chain. */
const METADATA_RENDERERS: Record<
  string,
  (meta: Meta) => React.ReactNode | null
> = {
  PROFILE_STATUS_UPDATED: (meta) => {
    const status = toStringOrNull(meta.newStatus);
    const reason = toStringOrNull(meta.reason);
    if (!status && !reason) return null;
    return (
      <div className="mt-1.5 flex flex-col items-start gap-1">
        {status && (
          <Badge variant="outline" className="font-normal">
            {status.replaceAll("_", " ")}
          </Badge>
        )}
        {reason && <Note>{reason}</Note>}
      </div>
    );
  },

  KYC_APPROVED: (meta) => {
    const reason = toStringOrNull(meta.reason);
    return reason ? <Note>{reason}</Note> : null;
  },

  PROFILE_UPDATED: (meta) => {
    const fields = (meta.fields ?? null) as Meta | null;
    if (!fields) return null;
    const changed = Object.keys(fields).filter((k) => fields[k] != null);
    if (changed.length === 0) return null;
    // The only thing distinguishing one "Profile updated" from the next. The
    // previous implementation collected these and then returned an empty
    // string, which React renders as nothing.
    return (
      <div className="mt-1.5 flex flex-wrap gap-1">
        {changed.map((field) => (
          <Badge key={field} variant="secondary" className="font-normal">
            {humanize(field)}
          </Badge>
        ))}
      </div>
    );
  },

  WALLET_MANUAL_CREDIT: (meta) => {
    const amount = toStringOrNull(meta.amount);
    const note = toStringOrNull(meta.note);
    if (!amount && !note) return null;
    return (
      <div className="mt-1.5 flex flex-col items-start gap-1">
        {amount && (
          <Badge variant="outline" className="font-normal tabular-nums">
            +{amount} FCFA
          </Badge>
        )}
        {note && <p className="text-muted-foreground text-xs">{note}</p>}
      </div>
    );
  },

  PAYMENT_CONFIRMED: (meta) => {
    const note = toStringOrNull(meta.note);
    return note ? (
      <p className="text-muted-foreground mt-1.5 text-xs">{note}</p>
    ) : null;
  },
};

// Same shape, same renderer.
METADATA_RENDERERS.KYC_REJECTED = METADATA_RENDERERS.KYC_APPROVED;
METADATA_RENDERERS.PAYMENT_FAILED = METADATA_RENDERERS.PAYMENT_CONFIRMED;

function MetadataDisplay({
  metadata,
  action,
}: Readonly<{
  metadata: Record<string, unknown> | null;
  action: string;
}>) {
  if (!metadata) return null;
  return METADATA_RENDERERS[action]?.(metadata) ?? null;
}

function TimelineShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ProfileTimeline({ logs, isLoading }: Readonly<Props>) {
  // Sorted here rather than trusting the API's order, so the grouping below
  // cannot produce a day heading that repeats further down the list.
  const groups = useMemo(
    () =>
      groupByDay(
        [...logs].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      ),
    [logs],
  );

  if (isLoading) {
    return (
      <TimelineShell>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i + 1}`} className="flex gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </TimelineShell>
    );
  }

  if (logs.length === 0) {
    return (
      <TimelineShell>
        <p className="text-muted-foreground py-6 text-center text-sm">
          No activity recorded yet.
        </p>
      </TimelineShell>
    );
  }

  return (
    <TimelineShell>
      <div className="max-h-96 space-y-5 overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group) => (
          <section key={group.heading}>
            {/* Sticky so the date stays answerable while scrolling a long run
                of same-day events, which is the usual shape here. */}
            <h3 className="bg-card text-muted-foreground sticky top-0 z-20 py-1 text-xs font-medium">
              {group.heading}
            </h3>

            <div className="relative">
              <div className="bg-border absolute top-2 bottom-2 left-4 w-px" />

              <div className="space-y-4">
                {group.logs.map((log) => {
                  const config = getActionConfig(log.action);
                  const Icon = config.icon;
                  const date = new Date(log.createdAt);
                  const valid = !Number.isNaN(date.getTime());

                  return (
                    <div key={log.id} className="relative flex gap-3">
                      <div
                        className={`bg-background relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border ${config.color}`}
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-sm font-medium">{config.label}</p>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
                          {valid && (
                            // Relative reads first because "how long ago" is the
                            // question; the exact stamp stays on hover for when
                            // it is not.
                            <span title={format(date, "PPpp")}>
                              {formatDistanceToNow(date, { addSuffix: true })}
                            </span>
                          )}
                          {valid && <span aria-hidden>·</span>}
                          {valid && <span>{format(date, "HH:mm")}</span>}
                          {log.userName && (
                            <>
                              <span aria-hidden>·</span>
                              <span>{log.userName}</span>
                            </>
                          )}
                        </div>
                        <MetadataDisplay
                          metadata={log.metadata}
                          action={log.action}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>
    </TimelineShell>
  );
}
