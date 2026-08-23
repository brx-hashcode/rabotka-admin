import { useState, useEffect } from "react";
import { IconCheck, IconFileText, IconX } from "@tabler/icons-react";
import { X } from "lucide-react";

import type {
  AdminKycDocumentItem,
  AdminProfileDetailResponse,
} from "#/lib/api/profiles-controller";
import { kycDocumentRawUrl } from "#/lib/api/profiles-controller";
import { getVerificationStatusLabel } from "#/lib/status-labels";
import type { ReasonTemplateScope } from "#/lib/reason-templates";

import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { ReasonField } from "#/components/reason-field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "#/components/ui/dialog";

import { docCategoryLabel, docTypeLabel } from "../helpers";
import { getVerificationStatusBadgeClass } from "#/features/applications/components/profile-columns";
import { ImageUploadZone } from "./image-upload-zone";
import { cn } from "#/lib/utils";

type KycVerificationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AdminProfileDetailResponse;
  onSubmit: (
    decision: "VERIFIED" | "REJECTED",
    reason: string,
    files?: File[],
  ) => void;
  isPending: boolean;
};

const REASON_PLACEHOLDER =
  "Enter the reason for your decision (required for approve and reject)…";

const REASON_SCOPE_BY_DECISION: Record<
  "VERIFIED" | "REJECTED",
  ReasonTemplateScope
> = {
  VERIFIED: "KYC_APPROVE",
  REJECTED: "KYC_REJECT",
};

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
  const [previewDoc, setPreviewDoc] = useState<AdminKycDocumentItem | null>(
    null,
  );

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
      setPreviewDoc(null);
    }
  }, [open]);

  const canSubmit =
    decision != null && reason.trim().length > 0 && !reasonError;

  /** Reason suggestions follow the decision; none until one is picked. */
  const reasonScope = decision ? REASON_SCOPE_BY_DECISION[decision] : null;

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!decision || !reason.trim()) {
      setReasonError(true);
      return;
    }
    onSubmit(decision, reason.trim(), files.length > 0 ? files : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle>KYC Verification</DialogTitle>
          <DialogDescription>
            Approve or reject this profile&apos;s KYC. Supporting uploads are
            optional; a reason is required and is stored on the profile.
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
              onClick={() => {
                setDecision("REJECTED");
                setReasonError(false);
              }}
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
            label="KYC supporting documents (optional)"
            maxSize={5 * 1024 * 1024}
          />

          {profile.kycDocuments.length > 0 && (
            <div className="space-y-2">
              {profile.kycDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-muted/50 flex items-center gap-3 rounded-md border p-2.5"
                >
                  <button
                    type="button"
                    title={
                      doc.fileAvailable
                        ? "Preview document"
                        : "Document file is missing"
                    }
                    onClick={() =>
                      doc.fileAvailable && setPreviewDoc(doc)
                    }
                    disabled={!doc.fileAvailable}
                    className="border-border bg-muted group relative h-14 w-14 shrink-0 overflow-hidden rounded-md border hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {doc.fileAvailable && doc.contentKind === "image" ? (
                      <>
                        <img
                          src={kycDocumentRawUrl(profile.id, doc.id)}
                          alt=""
                          className="h-full w-full object-cover"
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
                          className="absolute inset-0 hidden items-center justify-center"
                          style={{ display: "none" }}
                        >
                          <IconFileText className="text-muted-foreground size-7" />
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <IconFileText className="text-muted-foreground size-7" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {docCategoryLabel(doc.documentCategory)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {docTypeLabel(doc.documentType)}
                    </p>
                  </div>
                  <Badge
                    className={`shrink-0 ${getVerificationStatusBadgeClass(doc.verificationStatus)}`}
                  >
                    {getVerificationStatusLabel(doc.verificationStatus)}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <ReasonField
            value={reason}
            onChange={(value) => {
              setReason(value);
              if (value.trim()) setReasonError(false);
            }}
            templateScope={reasonScope}
            placeholder={REASON_PLACEHOLDER}
            required
            error={reasonError}
            disabled={isPending}
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

      {/* Nested viewer: same pattern as claim detail — keeps KYC dialog open underneath */}
      <Dialog
        open={previewDoc != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPreviewDoc(null);
        }}
      >
        <DialogContent
          className="w-full max-w-4xl border-0 bg-black/90 p-0"
          showClose={false}
        >
          <DialogHeader className="shrink-0 border-b border-white/10 px-4 py-3">
            <DialogTitle className="text-sm text-white">
              {previewDoc ? docCategoryLabel(previewDoc.documentCategory) : ""}
            </DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
              >
                <X className="h-4 w-4 text-white" />
                <span className="sr-only">Close</span>
              </button>
            </DialogClose>
          </DialogHeader>
          <div className="flex min-h-96 items-center justify-center bg-black/50 p-4">
            {previewDoc?.contentKind === "image" && (
              <img
                src={kycDocumentRawUrl(profile.id, previewDoc.id)}
                alt="KYC document"
                className="max-h-[70vh] max-w-full rounded object-contain"
              />
            )}
            {previewDoc != null && previewDoc.contentKind !== "image" && (
              <p className="text-muted-foreground text-sm">
                Preview is only available for images. Open the document from the
                KYC tab for the full viewer.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
