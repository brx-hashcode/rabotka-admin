import { toast } from "sonner";
import type { UploadRejection } from "#/pages/profile-detail/components/image-upload-zone";

/**
 * Tell the user why a file they picked was not accepted.
 *
 * `ImageUploadZone`'s `onReject` is optional, and the claim create modal never
 * passed it — so an oversize photograph simply never appeared and there was
 * nothing on screen to explain it. This is the KYC modal's handler, lifted out
 * so both callers share one behaviour instead of one of them having none.
 *
 * The count limit is reported ONCE however many files overflowed it: that is
 * one fact about the drop, not one per file, and dropping fifteen images should
 * not produce five identical toasts.
 */
export function reportUploadRejections(
  rejections: UploadRejection[],
  maxFiles: number,
): void {
  let reportedTooMany = false;

  rejections.forEach(({ file, errors }) => {
    const code = errors[0]?.code;
    if (code === "too-many-files") {
      if (!reportedTooMany) {
        toast.error(`Only ${maxFiles} images can be attached`);
        reportedTooMany = true;
      }
    } else if (code === "file-too-large") {
      toast.error(`${file.name} is larger than 5 MB`);
    } else {
      toast.error(`${file.name} is not a JPG, PNG or WEBP image`);
    }
  });
}
