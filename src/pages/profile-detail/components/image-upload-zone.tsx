import { useCallback, type ReactNode } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { IconUpload, IconX, IconPhoto } from "@tabler/icons-react";
import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";

/** A file the zone declined, and why. */
export type UploadRejection = {
  file: File;
  errors: { code: string; message: string }[];
};

type ImageUploadZoneProps = {
  files: File[];
  previews: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  /**
   * Called with anything the zone declined — too large, wrong type, or over
   * `maxFiles`. Optional: a caller that passes nothing keeps the historical
   * behaviour of dropping them silently.
   */
  onReject?: (rejections: UploadRejection[]) => void;
  /** Rendered over each thumbnail, for per-file upload status. */
  renderOverlay?: (index: number) => ReactNode;
  label?: string;
  maxSize?: number;
  maxFiles?: number;
};

export function ImageUploadZone({
  files,
  previews,
  onAdd,
  onRemove,
  onReject,
  renderOverlay,
  label = "Supporting Images",
  maxSize = 5 * 1024 * 1024,
  maxFiles,
}: Readonly<ImageUploadZoneProps>) {
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const images = acceptedFiles.filter((f) => f.type.startsWith("image/"));
      const remaining = maxFiles ? maxFiles - previews.length : images.length;
      const toAdd = images.slice(0, remaining);
      const overflow = images.slice(Math.max(remaining, 0));

      if (toAdd.length > 0) onAdd(toAdd);

      // `fileRejections` used to be collected by the dropzone and thrown away,
      // so an oversize file simply vanished with no message. The overflow slice
      // above was the same bug in a second place.
      if (onReject && (fileRejections.length > 0 || overflow.length > 0)) {
        onReject([
          // Copied into plain objects: react-dropzone's own errors are readonly
          // and carry a narrower `code` union than callers need to switch on.
          ...fileRejections.map((r) => ({
            file: r.file as File,
            errors: r.errors.map((e) => ({
              code: String(e.code),
              message: e.message,
            })),
          })),
          ...overflow.map((file) => ({
            file,
            errors: [
              {
                code: "too-many-files",
                message: `Maximum ${maxFiles} files`,
              },
            ],
          })),
        ]);
      }
    },
    [onAdd, onReject, maxFiles, previews.length],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/jpg": [],
      "image/webp": [],
    },
    maxSize,
    multiple: true,
    noClick: previews.length > 0,
  });

  const hasFiles = previews.length > 0;

  let zoneBorderClasses: string;
  if (isDragActive) {
    zoneBorderClasses = "border-dashed border-primary bg-primary/5";
  } else if (hasFiles) {
    zoneBorderClasses = "border hover:border-primary/50";
  } else {
    zoneBorderClasses = "hover:border-primary hover:bg-primary/5 border-dashed";
  }

  return (
    <div className="space-y-2">
      <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </label>

      <div
        {...(hasFiles ? {} : getRootProps())}
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all duration-200",
          zoneBorderClasses,
        )}
      >
        <input {...getInputProps()} className="sr-only" />

        {hasFiles ? (
          <div className="p-3">
            <div className="grid grid-cols-3 gap-3">
              {previews.map((url, i) => (
                <div
                  key={`thumbnail-${i + 1}`}
                  className="group/thumb relative aspect-square w-full overflow-hidden rounded-lg border"
                >
                  <img
                    src={url}
                    alt={files[i]?.name ?? "upload"}
                    className="h-full w-full object-cover"
                  />
                  <div className="from-background/80 absolute bottom-0 left-0 right-0 bg-linear-to-t to-transparent p-1.5">
                    <p className="text-foreground truncate text-[10px] font-medium">
                      {files[i]?.name}
                    </p>
                  </div>

                  {/* `pointer-events-none` so the status chip never swallows the
                      remove button underneath it; anything interactive inside
                      re-enables pointer events on itself. */}
                  {renderOverlay && (
                    <div className="pointer-events-none absolute inset-0">
                      {renderOverlay(i)}
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover/thumb:bg-black/40">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-xs"
                      className="opacity-0 transition-opacity group-hover/thumb:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(i);
                      }}
                    >
                      <IconX className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!maxFiles || previews.length < maxFiles) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  className="hover:border-primary hover:bg-primary/5 flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed transition-colors"
                >
                  <IconUpload className="text-muted-foreground size-5" />
                  <span className="text-muted-foreground text-xs">Add more</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-3 px-4 py-6 text-center">
            <div className="bg-primary/10 rounded-full p-3">
              <IconPhoto className="text-primary size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-foreground text-sm font-medium">
                {isDragActive
                  ? "Drop images here"
                  : "Click or drag images here"}
              </p>
              <p className="text-muted-foreground text-xs">
                JPG, PNG, WEBP — Max 5MB each
              </p>
            </div>
            <Button variant="outline" size="sm" type="button" className="mt-1">
              <IconUpload className="size-4" />
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
