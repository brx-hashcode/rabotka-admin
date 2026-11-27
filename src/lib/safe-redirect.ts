/**
 * A post-login destination on this site, or null.
 *
 * The path is checked as it will be navigated to. Parsing `/.//evil.example`
 * normalises it to the pathname `//evil.example`, which the browser then
 * reads as another host (security audit run 2): so the result, not only the
 * input, must stay a single-slash path that resolves to this origin.
 */
export function getSafeRedirectTarget(raw: string, origin: string = globalThis.location.origin): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return null;
    const target = `${url.pathname}${url.search}${url.hash}`;
    if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return null;
    return new URL(target, origin).origin === origin ? target : null;
  } catch {
    return null;
  }
}
