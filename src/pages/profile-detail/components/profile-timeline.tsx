import { useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
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
  IconBan,
  IconEye,
  IconFileUpload,
  IconLogin,
  IconPlayerPause,
  IconPlayerPlay,
  IconUserPlus,
  IconUserX,
  IconCoinOff,
  IconCash,
} from "@tabler/icons-react";

import type { AdminLogEntry } from "#/lib/api/profiles-controller";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";
import { groupByDay } from "#/lib/date-grouping";
import { humanizeCode } from "#/lib/status-labels";

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
    label: "Identity check approved",
    icon: IconShieldCheck,
    color: "text-emerald-500",
  },
  KYC_REJECTED: {
    label: "Identity check refused",
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
  // Field agents (admin/agents). Same timeline, same component.
  AGENT_CREATED: {
    label: "Agent created",
    icon: IconUserPlus,
    color: "text-emerald-500",
  },
  AGENT_UPDATED: {
    label: "Details updated",
    icon: IconEdit,
    color: "text-amber-500",
  },
  AGENT_SUSPENDED: {
    label: "Suspended",
    icon: IconPlayerPause,
    color: "text-amber-500",
  },
  AGENT_REACTIVATED: {
    label: "Reactivated",
    icon: IconPlayerPlay,
    color: "text-emerald-500",
  },
  AGENT_REVOKED: {
    label: "Revoked",
    icon: IconBan,
    color: "text-rose-500",
  },
  AGENT_LOGIN: {
    label: "Signed in to the agent app",
    icon: IconLogin,
    color: "text-sky-500",
  },
  AGENT_AVATAR_REPLACED: {
    label: "Photo replaced",
    icon: IconPhoto,
    color: "text-sky-500",
  },
  AGENT_KYC_DOCUMENT_REPLACED: {
    label: "Identity document replaced",
    icon: IconFileUpload,
    color: "text-violet-500",
  },
  AGENT_KYC_VIEWED: {
    label: "Identity document viewed",
    icon: IconEye,
    color: "text-muted-foreground",
  },
  // Agent invitations: on the agent's timeline and the worker's alike.
  AGENT_INVITE_SENT: {
    label: "Agent invitation sent",
    icon: IconSend,
    color: "text-sky-500",
  },
  AGENT_INVITE_ACCEPTED: {
    label: "Agent invitation accepted",
    icon: IconUserCheck,
    color: "text-emerald-500",
  },
  AGENT_INVITE_DECLINED: {
    label: "Agent invitation declined",
    icon: IconUserX,
    color: "text-rose-500",
  },
  AGENT_COMMISSION_EARNED: {
    label: "Commission earned",
    icon: IconCoin,
    color: "text-amber-500",
  },
  AGENT_COMMISSION_RELEASED: {
    label: "Commission withdrawable",
    icon: IconCash,
    color: "text-emerald-500",
  },
  AGENT_COMMISSION_CANCELLED: {
    label: "Commission cancelled",
    icon: IconCoinOff,
    color: "text-rose-500",
  },
  AGENT_COMMISSION_INELIGIBLE: {
    label: "Placement not paid",
    icon: IconCoinOff,
    color: "text-muted-foreground",
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
            {humanizeCode(status)}
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

// Agent entries. `fields` is a list of changed field names here, not the
// object PROFILE_UPDATED carries.
METADATA_RENDERERS.AGENT_UPDATED = (meta) => {
  const fields = Array.isArray(meta.fields)
    ? meta.fields.filter((f): f is string => typeof f === "string")
    : [];
  if (fields.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {fields.map((field) => (
        <Badge key={field} variant="secondary" className="font-normal">
          {humanize(field)}
        </Badge>
      ))}
    </div>
  );
};
METADATA_RENDERERS.AGENT_SUSPENDED = (meta) => {
  const reason = toStringOrNull(meta.reason);
  return reason ? <Note>{reason}</Note> : null;
};
METADATA_RENDERERS.AGENT_REVOKED = METADATA_RENDERERS.AGENT_SUSPENDED;
METADATA_RENDERERS.AGENT_KYC_DOCUMENT_REPLACED = (meta) => {
  const category = toStringOrNull(meta.category);
  return category ? (
    <Badge variant="secondary" className="mt-1.5 font-normal">
      {humanize(category)}
    </Badge>
  ) : null;
};

// Commissions: the amount, and the reason when it pays nothing.
METADATA_RENDERERS.AGENT_COMMISSION_EARNED = (meta) =>
  typeof meta.amount === "number" ? (
    <Badge variant="secondary" className="mt-1.5 font-normal">
      {`${meta.amount.toLocaleString("fr-FR")} FCFA`}
    </Badge>
  ) : null;
METADATA_RENDERERS.AGENT_COMMISSION_RELEASED =
  METADATA_RENDERERS.AGENT_COMMISSION_EARNED;
METADATA_RENDERERS.AGENT_COMMISSION_CANCELLED =
  METADATA_RENDERERS.AGENT_SUSPENDED;
METADATA_RENDERERS.AGENT_COMMISSION_INELIGIBLE =
  METADATA_RENDERERS.AGENT_SUSPENDED;

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
  // Sorting and bucketing live in the shared helper, so all three history
  // panels group identically rather than each drifting its own way.
  const groups = useMemo(() => groupByDay(logs, (log) => log.createdAt), [logs]);

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
          <section key={group.key}>
            {/* Sticky so the date stays answerable while scrolling a long run
                of same-day events, which is the usual shape here. */}
            <h3 className="bg-card text-muted-foreground sticky top-0 z-20 py-1 text-xs font-medium">
              {group.heading}
            </h3>

            <div className="relative">
              <div className="bg-border absolute top-2 bottom-2 left-4 w-px" />

              <div className="space-y-4">
                {group.items.map((log) => {
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
