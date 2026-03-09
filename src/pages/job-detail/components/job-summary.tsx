import { Link } from "@tanstack/react-router";
import {
  IconMail,
  IconPhone,
  IconExternalLink,
  IconUser,
} from "@tabler/icons-react";

import type { AdminJobOfferDetailResponse } from "#/lib/api/jobs-controller";
import {
  getJobOfferStatusLabel,
  getPaymentFlowLabel,
} from "#/lib/status-labels";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

import { statusBadgeVariant, formatDate } from "../helpers";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? ""))
    .toUpperCase()
    .slice(0, 2) || "?";
}

type Props = {
  job: AdminJobOfferDetailResponse;
};

export function JobSummary({ job }: Props) {
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
              variant={statusBadgeVariant(job.status)}
              className="mt-1"
            >
              {getJobOfferStatusLabel(job.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Payment Flow
            </p>
            <Badge variant="outline" className="mt-1">
              {getPaymentFlowLabel(job.paymentFlow)}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Created
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(job.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Applications
            </p>
            <p className="mt-1 text-sm font-medium">
              {job.applicationsCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employer card */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Employer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {job.employerAvatarUrl ? (
                <AvatarImage
                  src={job.employerAvatarUrl}
                  alt={job.employerName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(job.employerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {job.employerName || "—"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                ID: {job.employerId.slice(0, 8)}...
              </p>
            </div>
          </div>

          <Separator />

          {/* Contact details */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <IconMail className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate text-sm">{job.employerEmail || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconPhone className="text-muted-foreground size-4 shrink-0" />
              <span className="text-sm">{job.employerPhone || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconUser className="text-muted-foreground size-4 shrink-0" />
              <span className="text-muted-foreground text-xs">
                Employer account
              </span>
            </div>
          </div>

          {/* View profile link */}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link
              to="/profiles/$profileId"
              params={{ profileId: job.employerId }}
            >
              <IconExternalLink className="size-3.5" />
              View Profile
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
