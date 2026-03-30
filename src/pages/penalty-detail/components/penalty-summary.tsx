import { Link } from "@tanstack/react-router";
import {
  IconMail,
  IconPhone,
  IconExternalLink,
  IconBriefcase,
  IconFileText,
  IconUser,
} from "@tabler/icons-react";

import type { AdminPenaltyDetailResponse } from "#/lib/api/penalties-controller";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { buttonVariants } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

import { formatDate, formatAmount } from "../helpers";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase().slice(0, 2) ||
    "?"
  );
}

type Props = {
  penalty: AdminPenaltyDetailResponse;
};

export function PenaltySummary({ penalty }: Readonly<Props>) {
  const isPaid = penalty.paidAt != null;

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Payment
            </p>
            <Badge
              variant={isPaid ? "default" : "destructive"}
              className="mt-1"
            >
              {isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Amount
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatAmount(penalty.amount)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Applied
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(penalty.appliedAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Paid At
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(penalty.paidAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Worker card */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Worker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {penalty.workerAvatarUrl ? (
                <AvatarImage
                  src={penalty.workerAvatarUrl}
                  alt={penalty.workerName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(penalty.workerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {penalty.workerName || "—"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {penalty.workerEmail || "—"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <IconMail className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate text-sm">
                {penalty.workerEmail || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconPhone className="text-muted-foreground size-4 shrink-0" />
              <span className="text-sm">{penalty.workerPhone || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconUser className="text-muted-foreground size-4 shrink-0" />
              <span className="text-muted-foreground text-xs">
                Worker account
              </span>
            </div>
          </div>

          <Link
            to="/profiles/$profileId"
            params={{ profileId: penalty.workerId }}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            <IconExternalLink className="size-3.5" />
            View Profile
          </Link>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Related</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link
            to="/jobs/$jobId"
            params={{ jobId: penalty.jobOfferId }}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            <IconBriefcase className="size-3.5" />
            View Job
          </Link>
          <Link
            to="/applications/$applicationId"
            params={{ applicationId: penalty.applicationId }}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            <IconFileText className="size-3.5" />
            View Application
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
