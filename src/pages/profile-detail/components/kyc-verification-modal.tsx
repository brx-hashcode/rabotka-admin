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
import { cn } from "#/lib/utils";

type KycVerificationModalProps = {
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

const REASON_PLACEHOLDER = {
  REJECTED: "Provide a reason for rejection...",
  VERIFIED: "Add a comment...",
} as const;

function ReasonField({
  decision,
  reason,
  reasonError,
  onReasonChange,
}: Readonly<{
  decision: "VERIFIED" | "REJECTED" | null;
  reason: string;
  reasonError: boolean;
  onReasonChange: (value: string) => void;
}>) {
  const isRejected = decision === "REJECTED";
  const placeholder = isRejected
    ? REASON_PLACEHOLDER.REJECTED
    : REASON_PLACEHOLDER.VERIFIED;

  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        Reason{" "}
        {isRejected ? (
          <span className="text-destructive">*</span>
        ) : (
          "(optional)"
        )}
      </label>
      <Textarea
        placeholder={placeholder}
        value={reason}
        rows={3}
        onChange={(e) => onReasonChange(e.target.value)}
        className={cn("resize-none", reasonError && "border-destructive")}
      />
      {reasonError && (
        <p className="text-destructive text-xs">
          A reason is required when rejecting.
        </p>
      )}
    </div>
  );
}

export function KycVerificationModal({
  open,
  onOpenChange,
  profile,
  onSubmit,
  isPending,
}: Readonly<KycVerificationModalProps>) {
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
      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle>KYC Verification</DialogTitle>
          <DialogDescription>
            Review the uploaded documents and approve or reject this profile's
            KYC verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={cn(
                "flex h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 text-sm font-medium transition-all",
                decision === "VERIFIED"
                  ? "border-green-500 bg-green-500/15 text-green-500"
                  : "border-border hover:border-green-500/50 hover:text-green-500",
              )}
              onClick={() => {
                setDecision("VERIFIED");
                setReasonError(false);
              }}
            >
              <IconCheck className="size-6" />
              <span>Approve</span>
            </button>
            <button
              type="button"
              className={cn(
                "flex h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 text-sm font-medium transition-all",
                decision === "REJECTED"
                  ? "border-red-500 bg-red-500/15 text-red-500"
                  : "border-border hover:border-red-500/50 hover:text-red-500",
              )}
              onClick={() => setDecision("REJECTED")}
            >
              <IconX className="size-6" />
              <span>Reject</span>
            </button>
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

          <ReasonField
            decision={decision}
            reason={reason}
            reasonError={reasonError}
            onReasonChange={(value) => {
              setReason(value);
              if (value.trim()) setReasonError(false);
            }}
          />
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
