import { Link } from "@tanstack/react-router";
import {
  IconMail,
  IconPhone,
  IconExternalLink,
  IconBriefcase,
  IconUser,
} from "@tabler/icons-react";

import type { AdminApplicationDetailResponse } from "#/lib/api/applications-controller";
import {
  getApplicationStatusLabel,
  getJobOfferStatusLabel,
} from "#/lib/status-labels";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

import { statusBadgeVariant, formatDate } from "../helpers";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase().slice(0, 2) ||
    "?"
  );
}

type Props = {
  application: AdminApplicationDetailResponse;
};

export function ApplicationSummary({ application }: Readonly<Props>) {
  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Status
            </p>
            <Badge
              variant={statusBadgeVariant(application.status)}
              className="mt-1"
            >
              {getApplicationStatusLabel(application.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Job Status
            </p>
            <Badge
              variant={statusBadgeVariant(application.jobStatus)}
              className="mt-1"
            >
              {getJobOfferStatusLabel(application.jobStatus)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Applied
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(application.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Penalty
            </p>
            <p className="mt-1 text-sm font-medium">
              {application.penaltyApplied ? "Yes" : "No"}
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
              {application.workerAvatarUrl ? (
                <AvatarImage
                  src={application.workerAvatarUrl}
                  alt={application.workerName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(application.workerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {application.workerName || "—"}
              </p>
              {application.workerReliabilityScore != null && (
                <p className="text-muted-foreground text-xs">
                  Reliability: {application.workerReliabilityScore}%
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <IconMail className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate text-sm">
                {application.workerEmail || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconPhone className="text-muted-foreground size-4 shrink-0" />
              <span className="text-sm">
                {application.workerPhone || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconUser className="text-muted-foreground size-4 shrink-0" />
              <span className="text-muted-foreground text-xs">
                Worker account
              </span>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link
              to="/profiles/$profileId"
              params={{ profileId: application.workerId }}
            >
              <IconExternalLink className="size-3.5" />
              View Profile
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Employer card */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Employer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {application.employerAvatarUrl ? (
                <AvatarImage
                  src={application.employerAvatarUrl}
                  alt={application.employerName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(application.employerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {application.employerName || "—"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {application.employerEmail || "—"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link
                to="/profiles/$profileId"
                params={{ profileId: application.employerId }}
              >
                <IconExternalLink className="size-3.5" />
                View Profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link
                to="/jobs/$jobId"
                params={{ jobId: application.jobOfferId }}
              >
                <IconBriefcase className="size-3.5" />
                View Job
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
