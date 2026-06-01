const IMAGE_FILE_TYPES = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "avif",
  "heic",
  "heif",
  "image",
]);

/**
 * Detects image assets for preview: extensions, image/* fileType, Cloudinary image delivery.
 * Keep in sync with document / KYC viewers.
 */
export function isLikelyImageAsset(
  url: string | null | undefined,
  fileType?: string | null,
): boolean {
  const ft = (fileType ?? "").toLowerCase();
  if (ft.startsWith("image/")) return true;
  if (IMAGE_FILE_TYPES.has(ft)) return true;

  if (!url) return false;
  const u = url.toLowerCase();
  if (u.includes("/image/upload/")) return true;

  return /\.(jpe?g|png|gif|webp|bmp|svg|avif|heic|heif)(\?|#|$)/i.test(url);
}
