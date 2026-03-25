import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { updateClaim, deleteClaim } from "#/lib/api/claims-controller";
import type {
  AdminClaimItem,
  AdminClaimStatus,
} from "#/lib/api/claims-controller";
import { getUsersList } from "#/lib/api/users-controller";
import { ProfileCell } from "#/components/table";
import { ClaimComments } from "./claim-comments";

const STATUS_OPTIONS: { value: AdminClaimStatus; label: string }[] = [
  { value: "CREATED", label: "Created" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

type ClaimDetailDialogProps = {
  claim: AdminClaimItem | null;
  onClose: () => void;
};

function Field({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function ClaimDetailSheet({
  claim,
  onClose,
}: Readonly<ClaimDetailDialogProps>) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AdminClaimStatus>("CREATED");
  const [assignedUserId, setAssignedUserId] = useState<string>("none");

  useEffect(() => {
    if (claim) {
      setStatus(claim.status);
      setAssignedUserId(claim.assignedUserId ?? "none");
    }
  }, [claim]);

  const { data: usersData } = useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: () => getUsersList({ limit: 100 }),
    staleTime: 60_000,
  });
  const users = usersData?.data ?? [];

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () =>
      updateClaim(claim!.id, {
        status,
        assigned_user_id: assignedUserId === "none" ? null : assignedUserId,
      }),
    onSuccess: () => {
      toast.success("Claim updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      onClose();
    },
    onError: () => toast.error("Failed to update claim"),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteClaim(claim!.id),
    onSuccess: () => {
      toast.success("Claim deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      onClose();
    },
    onError: () => toast.error("Failed to delete claim"),
  });

  const isDirty =
    claim &&
    (status !== claim.status ||
      assignedUserId !== (claim.assignedUserId ?? "none"));

  const assignedUser = claim?.assignedUserId
    ? users.find((u) => u.id === claim.assignedUserId)
    : null;

  return (
    <Dialog
      open={Boolean(claim)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0 max-h-[90vh]">
        {claim && (
          <>
            {/* Header — title + status select */}
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <div className="flex items-start gap-3 pr-6">
                <DialogTitle className="flex-1 text-base leading-snug">
                  {claim.title}
                </DialogTitle>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as AdminClaimStatus)}
                >
                  <SelectTrigger className="h-7 w-36 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-xs"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="flex-1 flex flex-col gap-5 px-6 py-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Profile">
                  <ProfileCell
                    name={claim.profileName ?? ""}
                    email={claim.profileEmail ?? ""}
                    avatarUrl={claim.profileAvatarUrl}
                  />
                </Field>

                <Field label="Created by">
                  <ProfileCell
                    name={
                      claim.createdByUserName ??
                      claim.createdByProfileName ??
                      ""
                    }
                    email={claim.createdByUserEmail ?? ""}
                    avatarUrl={null}
                  />
                </Field>

                <Field label="Created at">
                  {format(new Date(claim.createdAt), "MMM d, yyyy · HH:mm")}
                </Field>

                <Field label="Last updated">
                  {format(new Date(claim.updatedAt), "MMM d, yyyy · HH:mm")}
                </Field>
              </div>

              <Field label="Description">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {claim.description}
                </p>
              </Field>

              {claim.attachmentUrls.length > 0 && (
                <Field label="Attachments">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {claim.attachmentUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline truncate max-w-[200px]"
                      >
                        {url.split("/").pop()}
                      </a>
                    ))}
                  </div>
                </Field>
              )}

              {/* Assigned to */}
              <div className="pt-4 border-t">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 block">
                  Assigned to
                </Label>
                {assignedUser ? (
                  <div className="flex items-center justify-between gap-3">
                    <ProfileCell
                      name={`${assignedUser.firstName} ${assignedUser.lastName}`}
                      email={assignedUser.email}
                      avatarUrl={null}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground shrink-0"
                      onClick={() => setAssignedUserId("none")}
                    >
                      Unassign
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={assignedUserId}
                    onValueChange={setAssignedUserId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder="Unassigned"
                        className="w-full"
                      />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Comments */}
              <div className="pt-4 border-t">
                <ClaimComments claimId={claim.id} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t shrink-0 flex items-center justify-end gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this claim?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove()}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                size="sm"
                onClick={() => save()}
                disabled={!isDirty || isSaving}
              >
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
