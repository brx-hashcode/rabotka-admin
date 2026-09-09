import type { OAuthApp } from "#/lib/api/oauth-apps-controller";

/**
 * What the "Client secret" row of an app card offers.
 *
 * - `hidden` — no copy control at all. A real application's secret genuinely
 *   cannot be read back, and a permanently greyed-out button would invite an
 *   admin to hunt for the toggle that turns it on. There isn't one.
 * - `copyable` — a sandbox app whose secret the server has kept.
 * - `needs-rotation` — a sandbox app registered before the server started
 *   keeping it. Its secret is genuinely gone; one rotation mints and stores a
 *   new one.
 *
 * A plain module rather than logic inside the card, matching `scopes.ts` beside
 * it: this repo's tests run in the default `node` environment (there is no
 * `test` block in `vite.config.ts`), so pure functions are the part that can
 * actually be covered.
 */
export type SecretRowState = "hidden" | "copyable" | "needs-rotation";

export function secretRowState(
  app: Pick<OAuthApp, "isSandbox" | "canCopySecret">,
): SecretRowState {
  // `isSandbox` is checked here and not only server-side on purpose. The server
  // refuses the read for a real app regardless, but a backend bug that set
  // `canCopySecret` on a real application must not put a copy button on it —
  // the UI should not be the thing that discovers the mistake by offering it.
  if (!app.isSandbox) return "hidden";
  return app.canCopySecret ? "copyable" : "needs-rotation";
}
