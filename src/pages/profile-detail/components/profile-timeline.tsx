import {
  IconShieldCheck,
  IconShieldX,
  IconUserCheck,
  IconEdit,
  IconCreditCard,
  IconClock,
} from "@tabler/icons-react";

import type { AdminLogEntry } from "#/lib/api/profiles-controller";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";

type Props = {
  logs: AdminLogEntry[];
  isLoading: boolean;
};

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof IconShieldCheck; color: string }
> = {
  KYC_APPROVED: {
    label: "KYC Approved",
    icon: IconShieldCheck,
    color: "text-green-500",
  },
  KYC_REJECTED: {
    label: "KYC Rejected",
    icon: IconShieldX,
    color: "text-red-500",
  },
  STATUS_CHANGED: {
    label: "Status Changed",
    icon: IconUserCheck,
    color: "text-blue-500",
  },
  PROFILE_UPDATED: {
    label: "Profile Updated",
    icon: IconEdit,
    color: "text-yellow-500",
  },
  PAYMENT_CONFIRMED: {
    label: "Payment Confirmed",
    icon: IconCreditCard,
    color: "text-green-500",
  },
};

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] ?? {
      label: action.replaceAll("_", " "),
      icon: IconClock,
      color: "text-muted-foreground",
    }
  );
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetadataDisplay({
  metadata,
  action,
}: {
  metadata: Record<string, unknown> | null;
  action: string;
}) {
  if (!metadata) return null;

  if (action === "STATUS_CHANGED" && metadata.newStatus) {
    return (
      <Badge variant="outline" className="mt-1">
        {String(metadata.newStatus).replaceAll("_", " ")}
      </Badge>
    );
  }

  if (
    (action === "KYC_REJECTED" || action === "KYC_APPROVED") &&
    metadata.reason
  ) {
    return (
      <p className="bg-muted mt-1 rounded p-1.5 text-xs">
        {String(metadata.reason)}
      </p>
    );
  }

  if (action === "PROFILE_UPDATED" && metadata.fields) {
    const fields = metadata.fields as Record<string, unknown>;
    const keys = Object.keys(fields).filter(
      (k) => fields[k] !== undefined && fields[k] !== null,
    );
    if (keys.length === 0) return null;
    return (
      <p className="text-muted-foreground mt-1 text-xs">
        Updated: {keys.join(", ")}
      </p>
    );
  }

  if (action === "PAYMENT_CONFIRMED" && metadata.note) {
    return (
      <p className="text-muted-foreground mt-1 text-xs">
        {String(metadata.note)}
      </p>
    );
  }

  return null;
}

export function ProfileTimeline({ logs, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center text-sm">
            No activity recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative max-h-90 overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Vertical line */}
          <div className="bg-border absolute top-0 bottom-0 left-4 w-px" />

          <div className="space-y-6">
            {logs.map((log) => {
              const config = getActionConfig(log.action);
              const Icon = config.icon;

              return (
                <div key={log.id} className="relative flex gap-3">
                  {/* Icon */}
                  <div
                    className={`bg-background relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border ${config.color}`}
                  >
                    <Icon className="size-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium">{config.label}</p>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                      {log.userName && <span>by {log.userName}</span>}
                      <span>{formatTimestamp(log.createdAt)}</span>
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
      </CardContent>
    </Card>
  );
}
