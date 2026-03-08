import { useState, useEffect } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";

import type { AdminProfileDetailResponse } from "#/lib/api/profiles-controller";
import { getVerificationStatusLabel } from "#/lib/status-labels";

import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Textarea } from "#/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "#/components/ui/dialog";

import { statusBadgeVariant, docCategoryLabel, docTypeLabel } from "../helpers";
import { ImageUploadZone } from "./image-upload-zone";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AdminProfileDetailResponse;
  onSubmit: (
    decision: "VERIFIED" | "REJECTED",
    reason?: string,
    files?: File[],
  ) => void;
  isPending: boolean;
};

const MIN_FILES_REQUIRED = 2;

export function KycVerificationModal({
  open,
  onOpenChange,
  profile,
  onSubmit,
  isPending,
}: Readonly<Props>) {
  const [decision, setDecision] = useState<"VERIFIED" | "REJECTED" | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  useEffect(() => {
    if (!open) {
      setDecision(null);
      setReason("");
      setReasonError(false);
      setFiles([]);
      setPreviews([]);
    }
  }, [open]);

  const canSubmit =
    decision != null &&
    (decision !== "REJECTED" || reason.trim().length > 0) &&
    !reasonError &&
    files.length >= MIN_FILES_REQUIRED;

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (decision === "REJECTED" && !reason.trim()) {
      setReasonError(true);
      return;
    }
    onSubmit(decision, reason.trim() || undefined, files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>KYC Verification</DialogTitle>
          <DialogDescription>
            Review the uploaded documents and approve or reject this profile's
            KYC verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={decision === "VERIFIED" ? "default" : "outline"}
              className={
                decision === "VERIFIED"
                  ? "h-auto flex-col gap-1.5 border-green-600 bg-green-600 py-4 text-white hover:bg-green-700"
                  : "h-auto flex-col gap-1.5 py-4"
              }
              onClick={() => {
                setDecision("VERIFIED");
                setReasonError(false);
              }}
            >
              <IconCheck className="size-5" />
              <span>Approve</span>
            </Button>
            <Button
              type="button"
              variant={decision === "REJECTED" ? "destructive" : "outline"}
              className="h-auto flex-col gap-1.5 py-4"
              onClick={() => setDecision("REJECTED")}
            >
              <IconX className="size-5" />
              <span>Reject</span>
            </Button>
          </div>

          <ImageUploadZone
            files={files}
            previews={previews}
            onAdd={addFiles}
            onRemove={removeFile}
            label="KYC supporting documents"
            maxSize={5 * 1024 * 1024}
          />
          {files.length > 0 && files.length < MIN_FILES_REQUIRED && (
            <p className="text-destructive text-xs">
              At least {MIN_FILES_REQUIRED} documents are required to submit.
              Please add {MIN_FILES_REQUIRED - files.length} more.
            </p>
          )}

          {/* Profile's existing KYC documents (reference) */}
          {profile.kycDocuments.length > 0 && (
            <div className="space-y-2">
              {profile.kycDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-muted/50 flex items-center gap-3 rounded-md border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {docCategoryLabel(doc.documentCategory)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {docTypeLabel(doc.documentType)}
                    </p>
                  </div>
                  <Badge
                    variant={statusBadgeVariant(doc.verificationStatus)}
                    className="shrink-0"
                  >
                    {getVerificationStatusLabel(doc.verificationStatus)}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Reason{" "}
              {decision === "REJECTED" ? (
                <span className="text-destructive">*</span>
              ) : (
                "(optional)"
              )}
            </label>
            <Textarea
              placeholder={
                decision === "REJECTED"
                  ? "Provide a reason for rejection..."
                  : "Add a comment..."
              }
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError(false);
              }}
              className={reasonError ? "border-destructive" : ""}
            />
            {reasonError && (
              <p className="text-destructive text-xs">
                A reason is required when rejecting.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending ? "Submitting..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
