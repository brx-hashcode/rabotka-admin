import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
} from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import type { AdminJobOfferListItem } from "#/lib/api/jobs-controller";
import {
  updateJobOfferStatus,
  deleteJobOffer,
} from "#/lib/api/jobs-controller";

type JobRowActionsProps = Readonly<{
  job: AdminJobOfferListItem;
}>;

export function JobRowActions({ job }: JobRowActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activateOpen, setActivateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "job-offers"] });

  const activateMutation = useMutation({
    mutationFn: () => updateJobOfferStatus(job.id, "ACTIVE"),
    onSuccess: () => {
      setActivateOpen(false);
      toast.success("Job offer activated.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => updateJobOfferStatus(job.id, "CANCELLED"),
    onSuccess: () => {
      setDeactivateOpen(false);
      toast.success("Job offer deactivated.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteJobOffer(job.id),
    onSuccess: () => {
      setDeleteOpen(false);
      toast.success("Job offer deleted.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const canActivate =
    job.status !== "ACTIVE" &&
    job.status !== "COMPLETED" &&
    job.status !== "CANCELLED";
  const canDeactivate =
    job.status === "ACTIVE" || job.status === "PARTIALLY_FILLED";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={() =>
              navigate({ to: "/jobs/$jobId", params: { jobId: job.id } })
            }
          >
            <EyeIcon className="size-4" />
            View
          </DropdownMenuItem>

          <DropdownMenuSeparator />

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

      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate job offer"
        description="This will set the job offer status to Active, making it visible to workers."
        actionLabel="Activate"
        onConfirm={() => activateMutation.mutate()}
        isPending={activateMutation.isPending}
        variant="default"
      />
      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate job offer"
        description="This will cancel the job offer. Workers will no longer be able to apply."
        actionLabel="Deactivate"
        onConfirm={() => deactivateMutation.mutate()}
        isPending={deactivateMutation.isPending}
        variant="destructive"
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete job offer"
        description="This will permanently delete the job offer and all its applications. This action cannot be undone."
        actionLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
        variant="destructive"
      />
    </>
  );
}
