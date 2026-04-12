import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { X } from "lucide-react";
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
import { useRole } from "#/hooks/use-role";

const STATUS_OPTIONS: { value: AdminClaimStatus; label: string }[] = [
  { value: "CREATED", label: "CREATED" },
  { value: "IN_PROGRESS", label: "IN PROGRESS" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "REJECTED", label: "REJECTED" },
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
  const { canManageContent } = useRole();
  const [status, setStatus] = useState<AdminClaimStatus>("CREATED");
  const [assignedUserId, setAssignedUserId] = useState<string>("none");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

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
    onError: (error) => toast.error(error.message),
  });

  const { mutate: unassign, isPending: isUnassigning } = useMutation({
    mutationFn: () => updateClaim(claim!.id, { assigned_user_id: null }),
    onSuccess: () => {
      toast.success("Claim unassigned");
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteClaim(claim!.id),
    onSuccess: () => {
      toast.success("Claim deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      onClose();
    },
    onError: (error) => toast.error(error.message),
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
      <DialogContent className="w-full sm:max-w-2xl flex flex-col gap-0 p-0 max-h-[90vh]">
        {claim && (
          <>
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <div className="flex items-start gap-3 pr-6">
                <DialogTitle className="flex-1 text-base leading-snug">
                  {claim.title}
                </DialogTitle>
                {canManageContent && (
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
                )}
              </div>
            </DialogHeader>

            <div
              className="flex-1 flex flex-col gap-5 px-6 py-5 overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
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
                      <button
                        key={url}
                        onClick={() => setSelectedImageUrl(url)}
                        className="group relative block w-16 h-16 rounded-md overflow-hidden border bg-muted shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        title={url.split("/").pop()}
                      >
                        <img
                          src={url}
                          alt={url.split("/").pop()}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                            (
                              e.currentTarget
                                .nextElementSibling as HTMLElement | null
                            )?.style.setProperty("display", "flex");
                          }}
                        />
                        <div
                          className="absolute inset-0 hidden items-center justify-center flex-col gap-1 p-2"
                          style={{ display: "none" }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2 break-all">
                            {url.split("/").pop()}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </button>
                    ))}
                  </div>
                </Field>
              )}

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
                    {canManageContent && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isUnassigning}
                          >
                            Unassign
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Unassign this claim?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {assignedUser.firstName} {assignedUser.lastName}{" "}
                              will be notified by email and removed from this
                              claim.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => unassign()}>
                              Unassign
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ) : canManageContent ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <ClaimComments claimId={claim.id} />
              </div>
            </div>

            {canManageContent && (
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
            )}
          </>
        )}
      </DialogContent>

      {/* Image Viewer Dialog */}
      <Dialog open={Boolean(selectedImageUrl)} onOpenChange={(open) => {
        if (!open) setSelectedImageUrl(null);
      }}>
        <DialogContent className="w-full max-w-4xl p-0 border-0 bg-black/90">
          <DialogHeader className="px-4 py-3 border-b border-white/10 shrink-0">
            <DialogTitle className="text-white text-sm">
              {selectedImageUrl?.split("/").pop()}
            </DialogTitle>
            <DialogClose asChild>
              <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4 text-white" />
                <span className="sr-only">Close</span>
              </button>
            </DialogClose>
          </DialogHeader>
          <div className="flex items-center justify-center bg-black/50 p-4 min-h-96">
            {selectedImageUrl && (
              <img
                src={selectedImageUrl}
                alt="Attachment"
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
