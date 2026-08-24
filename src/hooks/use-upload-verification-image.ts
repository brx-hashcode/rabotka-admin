import { useMutation } from "@tanstack/react-query";

import { uploadKycVerificationImage } from "#/lib/api/profiles-controller";

/**
 * Upload one KYC verification image, ahead of the verify call.
 *
 * READ ONLY `mutateAsync` FROM THIS. A single `useMutation` collapses N
 * concurrent uploads into one `isPending`/`data`/`error` — last write wins — so
 * reading its status would show the state of whichever upload finished most
 * recently rather than the one you are rendering. Per-file state belongs in the
 * caller's own array, keyed by item.
 */
export function useUploadVerificationImage(profileId: string) {
  return useMutation({
    mutationKey: ["admin", "profiles", profileId, "verification-image-upload"],
    mutationFn: (file: File) => uploadKycVerificationImage(profileId, file),
  });
}
