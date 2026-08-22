/**
 * The display / download name of a file, taken from its URL.
 *
 * Replaces `url.split("/").pop()`, which was correct only while every asset URL
 * was a bare public one. KYC documents are now served through signed URLs, so
 * that expression returns the whole credential query string:
 *
 *   1787425827340_xifmj6.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=…
 *
 * As a heading it overflows the dialog. As a `download` attribute it becomes
 * the actual filename on disk, which is worse than ugly.
 *
 * Returns `fallback` rather than an empty string when nothing usable is left,
 * so a caller can always hand the result straight to a download.
 */
export function fileNameFromUrl(
  url: string | null | undefined,
  fallback = "document",
): string {
  if (!url) return fallback;

  // Parse when we can, so the HOST is never mistaken for a path segment —
  // "https://x.dev/?a=1" has no filename at all, and naive splitting returns
  // "x.dev". Relative and blob:/data: urls fall back to string handling, where
  // cutting the query first matters: a signature contains encoded slashes and
  // splitting before the cut would pick one of those up.
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    path = url.split(/[?#]/)[0];
  }

  const last = path.split("/").filter(Boolean).pop();
  if (!last) return fallback;

  // `%20` etc. — a name is shown to a person and written to their disk.
  // decodeURIComponent throws on a lone `%`, which is not worth an error here.
  try {
    return decodeURIComponent(last) || fallback;
  } catch {
    return last;
  }
}
