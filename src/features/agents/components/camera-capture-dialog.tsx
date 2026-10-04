import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconCamera,
  IconCameraRotate,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { cn } from "#/lib/utils";

export type CameraFacing = "user" | "environment";

type Props = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  /** Which camera to start with: the back one for documents, front for faces. */
  readonly facing: CameraFacing;
  readonly onCapture: (file: File) => void;
};

/** Whether this browser can show a live camera at all (HTTPS + API present). */
export function canUseLiveCamera(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    globalThis.isSecureContext !== false
  );
}

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was refused. Allow the camera for this site in the browser settings, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is in use by another application.";
    default:
      return "Couldn't start the camera.";
  }
}

/**
 * Takes a photo with the device camera — for enrolling an agent on the spot
 * instead of asking them to send pictures afterwards.
 *
 * Live preview, capture, then a frozen review the admin accepts or retakes:
 * an ID photographed with glare or blur is caught here, not by the reviewer
 * later. The captured image is NOT mirrored, even when the preview of the
 * front camera is: the text on the document has to read the right way round.
 */
export function CameraCaptureDialog({
  open,
  onOpenChange,
  title,
  facing: initialFacing,
  onCapture,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<CameraFacing>(initialFacing);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const [canSwitch, setCanSwitch] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Start (or restart, on a camera switch) while the dialog is open and no
  // shot is being reviewed; always release the camera on the way out — a
  // stream left running keeps the device's camera light on.
  useEffect(() => {
    if (!open || shot) return;
    let cancelled = false;

    const start = async () => {
      setStarting(true);
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCanSwitch(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch (err) {
        if (!cancelled) setError(cameraErrorMessage(err));
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, facing, shot, stop]);

  // Reset between openings: the next document starts from its own camera.
  useEffect(() => {
    if (!open) {
      setFacing(initialFacing);
      setShot((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return null;
      });
      setError(null);
    }
  }, [open, initialFacing]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Couldn't capture the photo. Try again.");
          return;
        }
        setShot({ blob, url: URL.createObjectURL(blob) });
      },
      "image/jpeg",
      0.92,
    );
  };

  const retake = () => {
    setShot((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  const use = () => {
    if (!shot) return;
    onCapture(
      new File([shot.blob], `capture-${Date.now()}.jpg`, {
        type: "image/jpeg",
      }),
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {facing === "environment"
              ? "Lay the document flat in good light, fill the frame, and avoid glare."
              : "Face the camera in good light, with the whole face visible."}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-black">
          {shot ? (
            <img
              src={shot.url}
              alt="Captured"
              className="h-full w-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "h-full w-full object-contain",
                // Mirror only the PREVIEW of the front camera, which is what
                // people expect to see; the capture itself is not mirrored.
                facing === "user" && "-scale-x-100",
              )}
            />
          )}
          {starting && !shot && (
            <IconLoader2 className="absolute size-8 animate-spin text-white/70" />
          )}
          {error && !shot && (
            <p className="absolute inset-x-6 text-center text-sm text-white">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {shot ? (
            <>
              <Button type="button" variant="outline" onClick={retake}>
                <IconRefresh className="size-4" />
                Retake
              </Button>
              <Button type="button" onClick={use}>
                Use this photo
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFacing((f) => (f === "user" ? "environment" : "user"))
                }
                disabled={!canSwitch || starting}
              >
                <IconCameraRotate className="size-4" />
                Switch camera
              </Button>
              <Button
                type="button"
                onClick={capture}
                disabled={starting || !!error}
              >
                <IconCamera className="size-4" />
                Capture
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
