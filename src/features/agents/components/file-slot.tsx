import { useEffect, useRef, useState } from "react";
import {
  IconAlertCircle,
  IconCamera,
  IconCheck,
  IconFileText,
  IconLoader2,
  IconUpload,
} from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn } from "#/lib/utils";
import {
  CameraCaptureDialog,
  canUseLiveCamera,
  type CameraFacing,
} from "./camera-capture-dialog";

type Status = "idle" | "uploading" | "done" | "error";

type Props = {
  readonly label: string;
  readonly hint?: string;
  readonly accept: string;
  readonly maxBytes: number;
  /** Uploads the file and resolves with the storage key the API returned. */
  readonly upload: (file: File) => Promise<string>;
  /** The key once uploaded, or null when the slot is emptied or fails. */
  readonly onUploaded: (key: string | null) => void;
  /** What is stored today, for a replace slot: rendered until a new pick. */
  readonly currentPreview?: { url: string; kind: "image" | "pdf" | "other" };
  readonly round?: boolean;
  /**
   * Offer the device camera, starting on this side: `environment` (the back
   * camera) for documents, `user` for faces. Omit for upload only.
   */
  readonly camera?: CameraFacing;
  readonly disabled?: boolean;
};

/**
 * One file, uploaded the moment it is picked.
 *
 * Each document goes up on its own, before the form is submitted — the same
 * split as the profile KYC review — so a failed photograph is retried by
 * itself instead of failing the whole creation. The preview is the LOCAL file:
 * identity documents get no url from the server at all.
 */
export function FileSlot({
  label,
  hint,
  accept,
  maxBytes,
  upload,
  onUploaded,
  currentPreview,
  round,
  camera,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Fallback for browsers with no live-camera API: the native capture input,
  // which opens the phone camera app directly.
  const captureInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Object URLs pin the file in memory until revoked.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const send = async (picked: File) => {
    setStatus("uploading");
    setError(null);
    onUploaded(null);
    try {
      const key = await upload(picked);
      setStatus("done");
      onUploaded(key);
    } catch (err) {
      setStatus("error");
      setError(friendlyError(err, "Upload failed. Try again."));
    }
  };

  // A live preview where the browser allows it (desktop webcams, tablets);
  // otherwise the native camera app through the capture input.
  const openCamera = () => {
    if (canUseLiveCamera()) setCameraOpen(true);
    else captureInputRef.current?.click();
  };

  const pick = (picked: File | undefined) => {
    if (!picked) return;
    if (picked.size > maxBytes) {
      setStatus("error");
      setError(`File too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).`);
      return;
    }
    setFile(picked);
    setPreview(
      picked.type.startsWith("image/") ? URL.createObjectURL(picked) : null,
    );
    void send(picked);
  };

  let visual: React.ReactNode;
  if (preview) {
    visual = (
      <img src={preview} alt={label} className="h-full w-full object-cover" />
    );
  } else if (file) {
    visual = <IconFileText className="text-muted-foreground size-10" />;
  } else if (currentPreview?.kind === "image") {
    visual = (
      <img
        src={currentPreview.url}
        alt={label}
        className="h-full w-full object-cover"
      />
    );
  } else if (currentPreview) {
    visual = <IconFileText className="text-muted-foreground size-10" />;
  } else {
    visual = <IconUpload className="text-muted-foreground size-8" />;
  }

  return (
    <div className="bg-card shadow-soft flex min-w-0 flex-col gap-2 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{label}</p>
        {status === "uploading" && (
          <IconLoader2 className="text-muted-foreground size-4 animate-spin" />
        )}
        {status === "done" && <IconCheck className="size-4 text-emerald-600" />}
        {status === "error" && (
          <IconAlertCircle className="text-destructive size-4" />
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || status === "uploading"}
        className={cn(
          "bg-muted flex items-center justify-center overflow-hidden disabled:cursor-not-allowed",
          round ? "mx-auto size-24 rounded-full" : "h-32 w-full rounded-md",
        )}
        aria-label={`Choose ${label}`}
      >
        {visual}
      </button>

      {hint && !error && (
        <p className="text-muted-foreground text-xs">{hint}</p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}

      {/* mt-auto: pinned to the bottom, so the buttons line up across cards
          whose preview or hint is taller (the round photo, a long error). */}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || status === "uploading"}
        >
          <IconUpload className="size-4" />
          {file || currentPreview ? "Replace" : "Upload"}
        </Button>
        {camera && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={openCamera}
            disabled={disabled || status === "uploading"}
          >
            <IconCamera className="size-4" />
            Camera
          </Button>
        )}
        {status === "error" && file && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void send(file)}
            disabled={disabled}
          >
            Retry
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          // Reset so picking the same file again still fires onChange.
          e.target.value = "";
        }}
      />
      {camera && (
        <>
          <input
            ref={captureInputRef}
            type="file"
            accept="image/*"
            capture={camera}
            className="hidden"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <CameraCaptureDialog
            open={cameraOpen}
            onOpenChange={setCameraOpen}
            title={label}
            facing={camera}
            onCapture={pick}
          />
        </>
      )}
    </div>
  );
}
