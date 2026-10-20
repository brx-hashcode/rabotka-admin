import { useCallback, useEffect, useRef, useState } from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";

import { Button } from "#/components/ui/button";
import { compressImage } from "#/lib/media/image-compress";
import { friendlyError } from "#/lib/api/friendly-error";

/**
 * Images uploaded the moment they are picked, each on its own.
 *
 * Extracted from the KYC verification modal, where it replaced sending every
 * file with the final request: that made one slow or failed photograph take
 * the whole action down, and kept the admin on « Saving… » while the bytes
 * went up. Here each file is compressed, uploaded and tracked separately, so
 * the final request carries only URLs (or keys) and a single failure is
 * retried on its own.
 */

/** One attachment, tracked from the moment it is picked. */
export type UploadItem = {
  /** Stable across status changes, unlike an array index. */
  id: string;
  /** Null for an image that was already uploaded (seeded, e.g. when editing). */
  file: File | null;
  preview: string;
  status: "compressing" | "uploading" | "done" | "failed";
  key?: string;
  url?: string;
  error?: string;
};

export type UploadResult = { url: string; key?: string };

/**
 * A counter rather than `crypto.randomUUID()`, which is only defined in a
 * SECURE CONTEXT — https or localhost. Admin served over plain http to a LAN
 * address would get `undefined` and throw on the first file picked. These ids
 * only have to be unique within one session.
 */
let uploadItemSeq = 0;
const nextUploadItemId = () => `upload-${++uploadItemSeq}`;

/**
 * How many files may be compressing or uploading at once, PER DROP: enough to
 * not recreate a serial bottleneck, few enough not to saturate a slow uplink.
 */
const UPLOAD_CONCURRENCY = 3;

export function useImmediateUploads({
  upload,
  active,
}: {
  /** Sends one (already compressed) file and returns where it landed. */
  upload: (file: File) => Promise<UploadResult>;
  /**
   * Whether the screen that owns the uploads is still open. Requests take no
   * AbortSignal, so an upload in flight cannot be cancelled; this lets it
   * stop writing to state nobody owns any more.
   */
  active: boolean;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Mirrors `items` so object urls can be revoked from outside a state updater
  // — creating or revoking one inside an updater would make it impure, and
  // StrictMode runs updaters twice.
  const itemsRef = useRef<UploadItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const revoke = (url: string) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  const clear = useCallback(() => {
    itemsRef.current.forEach((item) => revoke(item.preview));
    itemsRef.current = [];
    setItems([]);
  }, []);

  // Revoke on unmount too.
  useEffect(() => clear, [clear]);

  /** Images already uploaded (an ad being edited): shown as done. */
  const seed = useCallback((urls: readonly string[]) => {
    const seeded: UploadItem[] = urls.map((url) => ({
      id: nextUploadItemId(),
      file: null,
      preview: url,
      status: "done",
      url,
    }));
    itemsRef.current.forEach((item) => revoke(item.preview));
    itemsRef.current = seeded;
    setItems(seeded);
  }, []);

  const patchItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    // Keyed by id: by the time this resolves the array may have been reordered
    // or filtered, so an index captured at call time would be wrong.
    if (!activeRef.current) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const runUpload = useCallback(
    async (id: string, file: File) => {
      try {
        const compressed = await compressImage(file);
        if (!activeRef.current) return;

        // Swap in a preview of what will actually be sent, and drop the
        // original's url now that nothing references it.
        const stalePreview = itemsRef.current.find((item) => item.id === id)?.preview;
        const preview = URL.createObjectURL(compressed);
        if (stalePreview) revoke(stalePreview);

        patchItem(id, { file: compressed, preview, status: "uploading" });

        const { key, url } = await upload(compressed);
        patchItem(id, { status: "done", key, url, error: undefined });
      } catch (error) {
        patchItem(id, {
          status: "failed",
          error: friendlyError(error, "Upload didn't go through. Try again."),
        });
      }
    },
    [upload, patchItem],
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const queued: UploadItem[] = newFiles.map((file) => ({
        id: nextUploadItemId(),
        file,
        // Preview the ORIGINAL immediately, so the thumbnail appears on pick
        // rather than after compression.
        preview: URL.createObjectURL(file),
        status: "compressing" as const,
      }));

      setItems((prev) => [...prev, ...queued]);

      // Bounded pool over THIS drop.
      let next = 0;
      const worker = async () => {
        while (next < queued.length) {
          const item = queued[next++];
          await runUpload(item.id, item.file as File);
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
    if (target) revoke(target.preview);
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const retryItem = useCallback(
    (id: string) => {
      const target = itemsRef.current.find((item) => item.id === id);
      if (!target?.file) return;
      patchItem(id, { status: "uploading", error: undefined });
      // Already compressed on the first attempt; re-encoding would only lose
      // quality.
      upload(target.file)
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
    [patchItem, upload],
  );

  return {
    items,
    addFiles,
    removeItem,
    retryItem,
    seed,
    clear,
    ...uploadFlags(items),
  };
}

/** Whether anything is still on its way up, or failed. Pure, for tests. */
export function uploadFlags(items: readonly Pick<UploadItem, "status">[]) {
  return {
    inFlight: items.some(
      (item) => item.status === "compressing" || item.status === "uploading",
    ),
    failed: items.some((item) => item.status === "failed"),
  };
}

/** The URLs of the uploaded images, in on-screen order. Pure, for tests. */
export function uploadedUrls(items: readonly Pick<UploadItem, "status" | "url">[]) {
  return items.flatMap((item) =>
    item.status === "done" && item.url ? [item.url] : [],
  );
}

/**
 * What is happening to one attachment, drawn over its thumbnail.
 *
 * Indeterminate rather than a percentage: requests are `fetch`-based and
 * expose no upload progress, and after compression these are a few hundred KB.
 */
export function UploadStatusOverlay({
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
