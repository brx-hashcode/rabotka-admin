import { useApplicationDetail } from "#/hooks/use-application-detail";
import {
  getApplicationStatusLabel,
  getJobOfferStatusLabel,
} from "#/lib/status-labels";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

import { statusBadgeVariant, formatDate } from "./application-detail/helpers";
import { ApplicationInfo } from "./application-detail/components/application-info";
import { ApplicationSummary } from "./application-detail/components/application-summary";
import { ApplicationPenaltiesTable } from "./application-detail/components/application-penalties-table";

export default function ApplicationDetailPage({
  applicationId,
}: Readonly<{
  applicationId: string;
}>) {
  const { application, isLoading, isError } =
    useApplicationDetail(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-8 pt-2">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={`skeleton-${i + 1}`}
                  className="h-20 rounded-lg"
                />
              ))}
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="flex h-64 items-center justify-center pt-4">
        <p className="text-muted-foreground">
          Failed to load application. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {/* 4 stat cards */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="gap-2 py-4">
              <CardContent className="px-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Status
                </p>
                <Badge variant={statusBadgeVariant(application.status)} className="mt-1.5">
                  {getApplicationStatusLabel(application.status)}
                </Badge>
              </CardContent>
            </Card>
            <Card className="gap-2 py-4">
              <CardContent className="px-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Job Status
                </p>
                <Badge variant={statusBadgeVariant(application.jobStatus)} className="mt-1.5">
                  {getJobOfferStatusLabel(application.jobStatus)}
                </Badge>
              </CardContent>
            </Card>
            <Card className="gap-2 py-4">
              <CardContent className="px-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Applied
                </p>
                <p className="mt-1.5 text-sm font-medium">
                  {formatDate(application.createdAt)}
                </p>
              </CardContent>
            </Card>
            <Card className="gap-2 py-4">
              <CardContent className="px-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Penalty
                </p>
                <p className="mt-1.5 text-sm font-medium">
                  {application.penaltyApplied ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>
          </div>
          <ApplicationInfo application={application} />
        </div>
        <div className="min-w-0">
          <ApplicationSummary application={application} />
        </div>
      </div>

      {application.penalties.length > 0 && (
        <section>
          <ApplicationPenaltiesTable penalties={application.penalties} />
        </section>
      )}
    </div>
  );
}
