const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

/**
 * Shrink an image in the browser before it is uploaded.
 *
 * Ported from the client's onboarding flow, where it is the reason a KYC upload
 * over a poor connection is bearable at all: a phone camera produces 4-6 MB per
 * shot, and this takes that to a few hundred KB with no visible loss at review
 * size. The admin side had no equivalent, so a reviewer attaching evidence was
 * pushing the raw originals.
 *
 * Keep this in step with `rabotka-client/src/lib/image-compress.ts`. The two are
 * deliberately identical copies rather than a shared package, because there is
 * no shared package between these repos.
 */
export async function compressImage(file: File): Promise<File> {
  // Only compress image types; return non-images (PDF) as-is
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          // Produce a new File independent of the original input element.
          // Use a unique name per compression call so that two camera captures
          // (which the browser often assigns the same generic filename, e.g.
          // "image.jpg") produce distinct File objects and don't collide in
          // state or when submitted.
          const baseName =
            file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_") ||
            "photo";
          const compressed = new File([blob], `${baseName}_${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Return the original file unchanged if the image can't be decoded — a
      // HEIC or a corrupt JPEG should still upload rather than block the review.
      resolve(file);
    };

    img.src = objectUrl;
  });
}
