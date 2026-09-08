import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button, buttonVariants } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import { FileText } from "lucide-react";
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
import { ClaimComments, claimAttachmentToViewerDoc } from "./claim-comments";
import {
  DocumentViewerDrawer,
  type ViewerDocument,
} from "#/pages/profile-detail/components/document-viewer-drawer";
import { useRole } from "#/hooks/use-role";
import { useAdminMe } from "#/hooks/use-admin-me";
import { fileNameFromUrl } from "#/lib/media/file-name-from-url";

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
  const { data: me } = useAdminMe();
  const [status, setStatus] = useState<AdminClaimStatus>("CREATED");
  const [assignedUserId, setAssignedUserId] = useState<string>("none");
  // One viewer for the whole sheet — the claim's own attachments and the ones
  // inside comments both open it. `DocumentViewerDrawer` is the app's shared
  // viewer, already used by six other features; the bespoke dialog this
  // replaces had no zoom, no rotate and no error state.
  const [viewerDoc, setViewerDoc] = useState<ViewerDocument | null>(null);

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
    // Status only. Assignment commits the moment it is picked — see `assign`
    // below — so bundling it here would let a stale local value overwrite an
    // assignment the server already has.
    mutationFn: () => updateClaim(claim!.id, { status }),
    onSuccess: () => {
      toast.success("Claim updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  /**
   * Assigning commits on change rather than waiting for Save.
   *
   * Picking a name in a list reads as the act itself — the previous flow left
   * the claim unassigned unless you also found the button at the bottom of a
   * scrolling sheet, which is a silent no-op at exactly the moment someone
   * thinks they have handed work over.
   *
   * Deliberately does NOT close the sheet, unlike Save: you assign a claim in
   * order to keep reading it.
   */
  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: (userId: string) =>
      updateClaim(claim!.id, {
        assigned_user_id: userId === "none" ? null : userId,
      }),
    onSuccess: () => {
      toast.success("Claim assigned");
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
    },
    onError: (error) => {
      // Put the control back where the server still has it, so the dropdown
      // never shows an assignment that did not happen.
      setAssignedUserId(claim?.assignedUserId ?? "none");
      toast.error(error.message);
    },
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

  // Status only: assignment is no longer pending work, so counting it here
  // would light up Save for a change that is already committed.
  const isDirty = claim && status !== claim.status;

  const assignedUser = claim?.assignedUserId
    ? users.find((u) => u.id === claim.assignedUserId)
    : null;
  /**
   * Whoever assigned a claim is the only one who may change that assignment.
   *
   * Mirrors the server's rule — this is only the UI half. The server refuses
   * the write regardless; showing a disabled control just means the admin
   * learns why before clicking rather than after.
   *
   * Null `assignedByUserId` means the assignment predates the column, so it
   * stays freely editable. SUPER_ADMIN can always override, because otherwise a
   * claim assigned by someone who has left the team could never be moved on.
   */
  const assignmentLockedBy =
    claim?.assignedUserId && claim.assignedByUserId ? claim.assignedByUserId : null;
  const canChangeAssignment =
    canManageContent &&
    (assignmentLockedBy === null ||
      assignmentLockedBy === me?.id ||
      me?.role === "SUPER_ADMIN");

  const canUnassign =
    canChangeAssignment && status !== "COMPLETED" && status !== "REJECTED";

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

            {/* `min-h-0` is what makes the overflow rule bite: a flex child
                defaults to min-height:auto, refuses to shrink below its
                content, and pushes the footer out of the dialog instead of
                scrolling. */}
            <div
              className="min-h-0 flex-1 flex flex-col gap-5 px-6 py-5 overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Profile">
                  {/* The claim is only half the story — "who is this and what
                      else is going on with them" is the next question every
                      time, and the answer is one page away. */}
                  <Link
                    to="/profiles/$profileId"
                    params={{ profileId: claim.profileId }}
                    onClick={onClose}
                    className="block rounded-md hover:opacity-80 transition-opacity"
                  >
                    <ProfileCell
                      name={claim.profileName ?? ""}
                      email={claim.profileEmail ?? ""}
                      avatarUrl={claim.profileAvatarUrl}
                    />
                  </Link>
                </Field>

                <Field label="Created by">
                  {/* Claims raised from the app carry a profile author; ones
                      opened by an admin carry a user, who has no page here. */}
                  {claim.createdByProfileId ? (
                    <Link
                      to="/profiles/$profileId"
                      params={{ profileId: claim.createdByProfileId }}
                      onClick={onClose}
                      className="block rounded-md hover:opacity-80 transition-opacity"
                    >
                      <ProfileCell
                        name={claim.createdByProfileName ?? ""}
                        email=""
                        avatarUrl={null}
                      />
                    </Link>
                  ) : (
                    <ProfileCell
                      name={
                        claim.createdByUserName ??
                        claim.createdByProfileName ??
                        ""
                      }
                      email={claim.createdByUserEmail ?? ""}
                      avatarUrl={null}
                    />
                  )}
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
                    {claim.attachmentUrls.map((url, idx) => (
                      <button
                        key={url}
                        onClick={() =>
                          setViewerDoc(claimAttachmentToViewerDoc(url, idx))
                        }
                        className="group relative block w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        title={fileNameFromUrl(url, "image")}
                      >
                        <img
                          src={url}
                          alt={fileNameFromUrl(url, "image")}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.setAttribute(
                              "data-visible",
                              "true",
                            );
                          }}
                        />
                        {/* Older claims may hold a PDF: say so rather than
                            leaving an empty square. */}
                        <div className="absolute inset-0 hidden flex-col items-center justify-center gap-1 p-2 data-[visible=true]:flex">
                          <FileText className="size-5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2 break-all">
                            {fileNameFromUrl(url, "image")}
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
                    {canUnassign && (
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
                    disabled={isAssigning || !canChangeAssignment}
                    onValueChange={(value) => {
                      // Local state first so the trigger updates immediately;
                      // `onError` puts it back if the write is refused.
                      setAssignedUserId(value);
                      assign(value);
                    }}
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

                {assignedUser && !canChangeAssignment && canManageContent && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Assigned by{" "}
                    {claim.assignedByUserName ?? "another administrator"} — only
                    they can change it.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t">
                <ClaimComments
                  claimId={claim.id}
                  onOpenAttachment={setViewerDoc}
                />
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
                      <AlertDialogAction
                        onClick={() => remove()}
                        className={buttonVariants({ variant: "destructive" })}
                      >
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

      {/* A sibling of DialogContent, not a child: nesting the drawer inside
          the dialog makes their focus traps fight, which is why the bespoke
          lightbox it replaces sat here too. */}
      <DocumentViewerDrawer
        open={viewerDoc !== null}
        onOpenChange={(open) => !open && setViewerDoc(null)}
        document={viewerDoc}
      />
    </Dialog>
  );
}
