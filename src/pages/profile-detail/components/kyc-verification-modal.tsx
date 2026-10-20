import { useState, useEffect, useCallback } from "react";
import {
  IconCheck,
  IconFileText,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import type {
  AdminKycDocumentItem,
  AdminProfileDetailResponse,
  AdminVerifyDocumentRef,
} from "#/lib/api/profiles-controller";
import { useUploadVerificationImage } from "#/hooks/use-upload-verification-image";
import {
  UploadStatusOverlay,
  useImmediateUploads,
} from "#/lib/media/use-immediate-uploads";
import type { UploadRejection } from "./image-upload-zone";
import { kycDocumentRawUrl } from "#/lib/api/profiles-controller";
import { getVerificationStatusLabel } from "#/lib/status-labels";
import type { ReasonTemplateScope } from "#/lib/reason-templates";

import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { ReasonField } from "#/components/reason-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "#/components/ui/dialog";

import { docCategoryLabel, docTypeLabel } from "../helpers";
import { getVerificationStatusBadgeClass } from "#/features/applications/components/profile-columns";
import { ImageUploadZone } from "./image-upload-zone";
import { DocumentViewerDrawer, toKycViewerDoc } from "./document-viewer-drawer";
import { cn } from "#/lib/utils";

type KycVerificationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AdminProfileDetailResponse;
  onSubmit: (
    decision: "VERIFIED" | "REJECTED",
    reason: string,
    documents?: AdminVerifyDocumentRef[],
  ) => void;
  isPending: boolean;
};

/** Matches ArrayMaxSize(10) on the API's documents field. */
const MAX_FILES = 10;

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
  // The document stays set while the drawer closes, so its contents do not
  // vanish mid-animation; `previewOpen` is what opens and closes it.
  const [previewDoc, setPreviewDoc] = useState<AdminKycDocumentItem | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const uploadImage = useUploadVerificationImage(profile.id).mutateAsync;
  const upload = useCallback(
    async (file: File) => {
      const { key, url } = await uploadImage(file);
      return { key, url };
    },
    [uploadImage],
  );
  // Each file is compressed and uploaded as it is picked; the verify call
  // then carries only keys. See lib/media/use-immediate-uploads.
  const {
    items,
    addFiles,
    removeItem,
    retryItem,
    clear: clearItems,
    inFlight: uploadsInFlight,
    failed: uploadsFailed,
  } = useImmediateUploads({ upload, active: open });

  useEffect(() => {
    if (!open) {
      setDecision(null);
      setReason("");
      setReasonError(false);
      clearItems();
      setPreviewOpen(false);
      setPreviewDoc(null);
    }
  }, [open, clearItems]);

  const handleRejections = useCallback((rejections: UploadRejection[]) => {
    // These used to be dropped in silence, so an oversize photograph simply
    // never appeared and the reviewer had no way to know.
    //
    // The count limit is reported ONCE however many files overflowed it — it is
    // one fact about the drop, not one per file, and dropping fifteen images
    // should not produce five identical toasts.
    let reportedTooMany = false;

    rejections.forEach(({ file, errors }) => {
      const code = errors[0]?.code;
      if (code === "too-many-files") {
        if (!reportedTooMany) {
          toast.error(`Only ${MAX_FILES} images can be attached`);
          reportedTooMany = true;
        }
      } else if (code === "file-too-large") {
        toast.error(`${file.name} is larger than 5 MB`);
      } else {
        toast.error(`${file.name} is not a JPG, PNG or WEBP image`);
      }
    });
  }, []);

  const canSubmit =
    decision != null &&
    reason.trim().length > 0 &&
    !reasonError &&
    !uploadsInFlight &&
    !uploadsFailed;

  /** Reason suggestions follow the decision; none until one is picked. */
  const reasonScope = decision ? REASON_SCOPE_BY_DECISION[decision] : null;

  const handleSubmit = () => {
    if (!decision || !reason.trim()) {
      setReasonError(true);
      return;
    }
    // Mapped to fresh objects deliberately, not spread: the API runs
    // `forbidNonWhitelisted`, so sending `id`/`status`/`preview` alongside the
    // descriptor would 400 the entire request.
    const documents: AdminVerifyDocumentRef[] = items
      .filter((item) => item.status === "done" && item.key)
      .map((item) => ({ key: item.key as string, url: item.url }));

    onSubmit(decision, reason.trim(), documents.length > 0 ? documents : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Capped to the viewport and laid out as a column so only the middle
          scrolls. Scrolling the dialog as a whole would push Confirm and Cancel
          off-screen on a short window — which is what happened here: a profile
          with three documents plus the reason box outgrew the viewport and the
          decision buttons became unreachable. */}
      <DialogContent className="flex max-h-[90vh] w-full max-w-xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Identity check (KYC)</DialogTitle>
          <DialogDescription>
            Approve or reject this profile&apos;s KYC. Supporting uploads are
            optional; a reason is required and is stored on the profile.
          </DialogDescription>
        </DialogHeader>

        {/* `min-h-0` is what actually lets this scroll: a flex child defaults to
            min-height:auto, which refuses to shrink below its content and pushes
            the overflow outside the dialog instead of into a scrollbar. */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
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
            files={items.map((item) => item.file ?? new File([], ""))}
            previews={items.map((item) => item.preview)}
            onAdd={addFiles}
            onRemove={removeItem}
            onReject={handleRejections}
            renderOverlay={(index) => (
              <UploadStatusOverlay item={items[index]} onRetry={retryItem} />
            )}
            label="Extra documents for the identity check (optional)"
            maxSize={5 * 1024 * 1024}
            maxFiles={MAX_FILES}
          />

          {uploadsFailed && (
            <p className="text-destructive text-xs">
              Retry or remove the failed upload before confirming.
            </p>
          )}

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
                    onClick={() => {
                      if (!doc.fileAvailable) return;
                      setPreviewDoc(doc);
                      setPreviewOpen(true);
                    }}
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

        <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending && "Submitting..."}
            {!isPending && uploadsInFlight && "Uploading…"}
            {!isPending && !uploadsInFlight && "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* The app's shared viewer, opened over this dialog — which stays open
          underneath, so the reviewer comes back to their decision and reason
          exactly as they left them. It used to be a second dialog here showing
          a fixed-size image with none of the viewer's zoom, rotate or download. */}
      <DocumentViewerDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDoc ? toKycViewerDoc(profile.id, previewDoc) : null}
      />
    </Dialog>
  );
}

