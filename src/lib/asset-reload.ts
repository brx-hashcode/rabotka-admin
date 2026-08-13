/**
 * Recover from a failed lazy-chunk / CSS load.
 *
 * With `autoCodeSplitting` + `defaultPreload: 'intent'`, hovering a link kicks
 * off a fetch for that route's JS and CSS. Two things make those fetches fail
 * in production:
 *
 *   1. A deploy landed while the tab was open. index.html is `no-store`, so the
 *      open tab still holds the *previous* build's hashed filenames — which no
 *      longer exist on the server.
 *   2. A transient network drop (ERR_CONNECTION_RESET, flaky mobile link).
 *
 * Either way the dynamic import rejects, TanStack Router catches it, and the
 * user is parked on the default "Something went wrong!" screen until they think
 * to hard-refresh. Vite fires `vite:preloadError` first, so we reload instead —
 * a reload re-fetches index.html and picks up the current asset names.
 *
 * The cooldown is what keeps this from becoming a refresh loop: if the assets
 * are genuinely gone (bad deploy, dead CDN), the second failure inside the
 * window falls through to the router's error component instead of reloading
 * forever.
 */
const RELOAD_KEY = "rabotka:asset-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

export function attachAssetReload(): void {
  window.addEventListener("vite:preloadError", (event) => {
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);

    if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) {
      return; // Already tried a reload; let the error surface to the UI.
    }

    // Stop Vite from rethrowing so the router never sees the rejection.
    event.preventDefault();
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    window.location.reload();
  });
}
