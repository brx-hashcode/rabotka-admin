import { useJobDetail } from "#/hooks/use-job-detail";
import type { AdminUpdateJobOfferParams } from "#/lib/api/jobs-controller";

import { Skeleton } from "#/components/ui/skeleton";

import { JobForm } from "./job-detail/components/job-form";
import { JobSummary } from "./job-detail/components/job-summary";
import { JobApplicationsTable } from "./job-detail/components/job-applications-table";

export default function JobDetailPage({
  jobId,
}: Readonly<{
  jobId: string;
}>) {
  const { job, isLoading, isError, updateJob, isUpdating } =
    useJobDetail(jobId);

  const handleSave = async (data: AdminUpdateJobOfferParams) => {
    await updateJob(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pt-2">
        <header>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </header>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="flex h-64 items-center justify-center pt-4">
        <p className="text-muted-foreground">
          Failed to load job offer. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-2">
      {/* Main content: job form + summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <JobForm job={job} onSave={handleSave} isSaving={isUpdating} />
        </div>
        <div className="min-w-0">
          <JobSummary job={job} />
        </div>
      </div>

      {/* Applications */}
      <section>
        <JobApplicationsTable applications={job.applications} />
      </section>
    </div>
  );
}
