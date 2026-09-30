import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconCheck,
  IconFileText,
  IconX,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type {
  AdminKycDocumentItem,
  AdminProfileDetailResponse,
  AdminVerifyDocumentRef,
} from "#/lib/api/profiles-controller";
import { useUploadVerificationImage } from "#/hooks/use-upload-verification-image";
import { compressImage } from "#/lib/media/image-compress";
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
import { friendlyError } from "#/lib/api/friendly-error";

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

/**
 * One attachment, tracked from the moment it is picked.
 *
 * The bytes used to ride along with the verify request, so the modal only ever
 * needed a `File[]`. Now each file is compressed and uploaded on its own as
 * soon as it is chosen, and this is what carries that journey: its status, its
 * preview, and — once it lands — the descriptor the verify call will send.
 */
type UploadItem = {
  /** Stable across status changes, unlike an array index. */
  id: string;
  file: File;
  preview: string;
  status: "compressing" | "uploading" | "done" | "failed";
  key?: string;
  url?: string;
  error?: string;
};

/**
 * Ids for upload items.
 *
 * A counter rather than `crypto.randomUUID()`, which is only defined in a
 * SECURE CONTEXT — https or localhost. Admin served over plain http to a LAN
 * address (a staging box, a phone on the same network) would get `undefined`
 * and throw on the first file picked. These ids only have to be unique within
 * one session, so global uniqueness buys nothing worth that failure mode.
 */
let uploadItemSeq = 0;
const nextUploadItemId = () => `upload-${++uploadItemSeq}`;

/**
 * How many files may be compressing or uploading at once, PER DROP. Two rapid
 * drops can therefore exceed it — acceptable, since the point is to avoid one
 * large batch saturating a slow uplink, not to enforce a global budget.
 */
const UPLOAD_CONCURRENCY = 3;

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
  const [items, setItems] = useState<UploadItem[]>([]);
  // The document stays set while the drawer closes, so its contents do not
  // vanish mid-animation; `previewOpen` is what opens and closes it.
  const [previewDoc, setPreviewDoc] = useState<AdminKycDocumentItem | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const uploadImage = useUploadVerificationImage(profile.id).mutateAsync;

  // The SDK's request takes no AbortSignal, so an upload in flight cannot be
  // cancelled when the dialog closes. This lets the async pipeline notice and
  // stop writing to state it no longer owns.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Mirrors `items` so object urls can be revoked from outside a state updater.
  // Creating or revoking one inside an updater would make it impure, and React
  // invokes updaters twice under StrictMode — which would leak one url per
  // upload the day somebody turns StrictMode on.
  const itemsRef = useRef<UploadItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Object urls are created and revoked explicitly rather than derived in an
  // effect. The previous version rebuilt every preview whenever the file list
  // changed, which under this model would revoke live previews mid-upload —
  // `items` now changes on each status transition, not just on add and remove.
  const clearItems = useCallback(() => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
    itemsRef.current = [];
    setItems([]);
  }, []);

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

  // Revoke on unmount too — closing the dialog is the usual exit, but not the
  // only one.
  useEffect(() => clearItems, [clearItems]);

  const patchItem = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      // Functional update keyed by id: by the time this resolves the array may
      // have been reordered or filtered by another in-flight upload or a
      // removal, so an index captured at call time would be wrong.
      if (!openRef.current) return;
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const runUpload = useCallback(
    async (id: string, file: File) => {
      try {
        const compressed = await compressImage(file);
        if (!openRef.current) return;

        // Swap in a preview of what will actually be sent, and drop the
        // original's url now that nothing references it. Both url operations
        // happen HERE rather than inside the updater, so the updater stays pure.
        const stalePreview = itemsRef.current.find(
          (item) => item.id === id,
        )?.preview;
        const preview = URL.createObjectURL(compressed);
        if (stalePreview) URL.revokeObjectURL(stalePreview);

        patchItem(id, { file: compressed, preview, status: "uploading" });

        const { key, url } = await uploadImage(compressed);
        patchItem(id, { status: "done", key, url, error: undefined });
      } catch (error) {
        patchItem(id, {
          status: "failed",
          error: friendlyError(error, "Upload didn't go through. Try again."),
        });
      }
    },
    [uploadImage, patchItem],
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const queued: UploadItem[] = newFiles.map((file) => ({
        id: nextUploadItemId(),
        file,
        // Preview the ORIGINAL immediately so the thumbnail appears on pick
        // rather than after compression finishes.
        preview: URL.createObjectURL(file),
        status: "compressing" as const,
      }));

      setItems((prev) => [...prev, ...queued]);

      // Bounded pool over THIS drop. Sequential would recreate the serial
      // bottleneck this change exists to remove; unbounded would saturate a
      // slow uplink and make every thumbnail crawl at once, which looks worse
      // than the single large request it replaced.
      let next = 0;
      const worker = async () => {
        while (next < queued.length) {
          const item = queued[next++];
          await runUpload(item.id, item.file);
        }
      };
      void Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queued.length) }, () =>
          worker(),
        ),
      );
    },
    [runUpload],
  );

  const removeItem = useCallback((index: number) => {
    const target = itemsRef.current[index];
    if (target) URL.revokeObjectURL(target.preview);
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const retryItem = useCallback(
    (id: string) => {
      const target = itemsRef.current.find((item) => item.id === id);
      if (!target) return;
      patchItem(id, { status: "uploading", error: undefined });
      // The file was already compressed on the first attempt; doing it again
      // would re-encode an already-lossy image for nothing.
      uploadImage(target.file)
        .then(({ key, url }) =>
          patchItem(id, { status: "done", key, url, error: undefined }),
        )
        .catch((error: unknown) =>
          patchItem(id, {
            status: "failed",
            error: friendlyError(error, "Upload didn't go through. Try again."),
          }),
        );
    },
    [patchItem, uploadImage],
  );

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

  const uploadsInFlight = items.some(
    (item) => item.status === "compressing" || item.status === "uploading",
  );
  const uploadsFailed = items.some((item) => item.status === "failed");

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
            files={items.map((item) => item.file)}
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

/**
 * What is happening to one attachment, drawn over its thumbnail.
 *
 * Indeterminate rather than a percentage: the API client is `fetch`-based and
 * exposes no upload progress, and after compression these are a few hundred KB,
 * so a determinate bar would mostly be animating jitter. What matters to the
 * reviewer is which file is still going and which one failed.
 */
function UploadStatusOverlay({
  item,
  onRetry,
}: Readonly<{ item: UploadItem | undefined; onRetry: (id: string) => void }>) {
  if (!item || item.status === "done") return null;

  if (item.status === "failed") {
    return (
      <div className="bg-destructive/70 absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white">
        <IconAlertTriangle className="size-5" />
        <span className="px-1 text-center text-[10px] font-medium">
          {item.error ?? "The file couldn't be uploaded. Try again."}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          // The wrapper is pointer-events-none so the chip never swallows the
          // remove button; this one control opts back in.
          className="pointer-events-auto"
          title="Upload again"
          onClick={(e) => {
            e.stopPropagation();
            onRetry(item.id);
          }}
        >
          <IconRefresh className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 text-white">
      <Loader2 className="size-5 animate-spin" />
      <span className="text-[10px] font-medium">
        {item.status === "compressing" ? "Compressing…" : "Uploading…"}
      </span>
    </div>
  );
}
