import { useState, useMemo } from "react";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
  IconChevronDown,
} from "@tabler/icons-react";

import { useJobDetail } from "#/hooks/use-job-detail";
import type { AdminUpdateJobOfferParams } from "#/lib/api/jobs-controller";

import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";

import { JobForm } from "./job-detail/components/job-form";
import { JobSummary } from "./job-detail/components/job-summary";
import { JobApplicationsTable } from "./job-detail/components/job-applications-table";
import { useNavigate } from "@tanstack/react-router";

export default function JobDetailPage({
  jobId,
}: Readonly<{
  jobId: string;
}>) {
  const navigate = useNavigate();

  const {
    job,
    isLoading,
    isError,
    updateJob,
    isUpdating,
    updateStatus,
    isUpdatingStatus,
    deleteJob,
    isDeleting,
  } = useJobDetail(jobId);

  const [activateOpen, setActivateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isEditable = job?.status === "ACTIVE";

  const canActivate = useMemo(
    () =>
      job != null &&
      job.status !== "ACTIVE" &&
      job.status !== "COMPLETED" &&
      job.status !== "CANCELLED",
    [job?.status],
  );
  const canDeactivate = useMemo(
    () => job?.status === "ACTIVE" || job?.status === "PARTIALLY_FILLED",
    [job?.status],
  );

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
                <Skeleton
                  key={`skeleton-${i + 1}`}
                  className="h-20 rounded-lg"
                />
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
    <div className="space-y-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{job.title}</h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Actions
              <IconChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              disabled={!canActivate}
              onClick={() => canActivate && setActivateOpen(true)}
            >
              <IconPlayerPlay className="size-4" />
              Activate
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canDeactivate}
              onClick={() => canDeactivate && setDeactivateOpen(true)}
            >
              <IconPlayerPause className="size-4" />
              Deactivate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <IconTrash className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <JobForm
            job={job}
            onSave={handleSave}
            isSaving={isUpdating}
            disabled={!isEditable}
          />
        </div>
        <div className="min-w-0">
          <JobSummary job={job} />
        </div>
      </div>

      <section>
        <JobApplicationsTable applications={job.applications} />
      </section>

      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate job offer"
        description="This will set the job offer status to Active, making it visible to workers."
        actionLabel="Activate"
        onConfirm={() =>
          updateStatus("ACTIVE").then(() => setActivateOpen(false))
        }
        isPending={isUpdatingStatus}
        variant="default"
      />

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate job offer"
        description="This will cancel the job offer. Workers will no longer be able to apply."
        actionLabel="Deactivate"
        onConfirm={() =>
          updateStatus("CANCELLED").then(() => setDeactivateOpen(false))
        }
        isPending={isUpdatingStatus}
        variant="destructive"
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete job offer"
        description="This will permanently delete the job offer and all its applications. This action cannot be undone."
        actionLabel="Delete"
        onConfirm={() =>
          deleteJob().then((res) => {
            setDeleteOpen(false);
            if (res.success) {
              navigate({ to: "/jobs" });
            }
          })
        }
        isPending={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
