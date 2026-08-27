import { useId, useRef } from "react";
import { IconCamera, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "#/lib/utils";

/** 2MB. The logo renders at 56px on the consent screen. */
const MAX_SIZE = 2 * 1024 * 1024;

type LogoPickerProps = {
  /** Object URL for a newly picked file, or an existing hosted URL. */
  preview: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
  /** Seeds the placeholder initials before a logo is chosen. */
  name?: string;
  disabled?: boolean;
};

/**
 * A square logo picker, shaped like a profile-photo control.
 *
 * Deliberately not `ImageUploadZone`: that is a drag-and-drop area sized for
 * several supporting images, and at the top of a registration form it dominated
 * everything under it. One small logo is closer to an avatar than to a gallery,
 * so it gets the avatar affordance — click the square, see the result in the
 * square.
 *
 * The preview is also a live rendering of what the consent screen will show,
 * which is the only thing this image is ever used for.
 */
export function LogoPicker({
  preview,
  onPick,
  onClear,
  name,
  disabled,
}: Readonly<LogoPickerProps>) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }

    if (file.size > MAX_SIZE) {
      // Said in MB rather than bytes, and with the actual size, because "too
      // large" alone leaves the admin guessing how much to shrink it by.
      toast.error(
        `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 2MB`,
      );
      return;
    }

    onPick(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <label
          htmlFor={inputId}
          className={cn(
            "bg-muted hover:bg-muted/70 group relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-xl transition-colors",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Logo preview"
                className="size-full object-cover"
              />
              {/* Only on hover: the point of the square is to show the logo. */}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <IconCamera className="size-5 text-white" />
              </span>
            </>
          ) : (
            <span className="text-muted-foreground flex flex-col items-center gap-1">
              {name?.trim() ? (
                <span className="text-lg font-semibold">
                  {name.trim().slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <IconCamera className="size-5" />
              )}
            </span>
          )}
        </label>

        {preview && !disabled && (
          <button
            type="button"
            aria-label="Remove logo"
            onClick={() => {
              onClear();
              // Without this, re-picking the same file fires no change event
              // and the logo silently fails to come back.
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="bg-background text-muted-foreground hover:text-foreground absolute -top-1.5 -right-1.5 rounded-full p-1 shadow-sm"
          >
            <IconX className="size-3.5" />
          </button>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">Logo</p>
        <p className="text-muted-foreground text-xs">
          Optional. Shown on the consent screen. Square, under 2MB.
        </p>
      </div>
    </div>
  );
}
