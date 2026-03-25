import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import { Badge } from "#/components/ui/badge";
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
import type { AdminClaimItem, AdminClaimStatus } from "#/lib/api/claims-controller";
import { getUsersList } from "#/lib/api/users-controller";
import { cn } from "#/lib/utils";

const STATUS_OPTIONS: { value: AdminClaimStatus; label: string }[] = [
  { value: "CREATED", label: "Created" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_COLORS: Record<AdminClaimStatus, string> = {
  CREATED: "bg-blue-500/10 text-blue-600 border-blue-200",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  COMPLETED: "bg-green-500/10 text-green-600 border-green-200",
  REJECTED: "bg-red-500/10 text-red-600 border-red-200",
};

type ClaimDetailSheetProps = {
  claim: AdminClaimItem | null;
  onClose: () => void;
};

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function ClaimDetailSheet({ claim, onClose }: Readonly<ClaimDetailSheetProps>) {
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
    claim && (status !== claim.status || assignedUserId !== (claim.assignedUserId ?? "none"));

  return (
    <Sheet open={Boolean(claim)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {claim && (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-start gap-3">
                <SheetTitle className="flex-1 text-base leading-snug">{claim.title}</SheetTitle>
                <Badge variant="outline" className={cn("shrink-0 text-xs", STATUS_COLORS[claim.status])}>
                  {STATUS_OPTIONS.find((s) => s.value === claim.status)?.label}
                </Badge>
              </div>
            </SheetHeader>

            <div className="space-y-5">
              <Field label="Profile">
                {claim.profileName ?? "—"}
                {claim.profileEmail && (
                  <span className="ml-1 text-muted-foreground">({claim.profileEmail})</span>
                )}
              </Field>

              <Field label="Description">
                <p className="whitespace-pre-wrap">{claim.description}</p>
              </Field>

              {claim.attachmentUrls.length > 0 && (
                <Field label="Attachments">
                  <div className="flex flex-wrap gap-2">
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

              <Field label="Created by">
                {claim.createdByUserName ?? claim.createdByProfileName ?? "—"}
              </Field>

              <Field label="Created at">
                {format(new Date(claim.createdAt), "MMM d, yyyy HH:mm")}
              </Field>

              {/* Editable fields */}
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as AdminClaimStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Assigned to</Label>
                  <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete claim?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove()}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button size="sm" onClick={() => save()} disabled={!isDirty || isSaving}>
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
