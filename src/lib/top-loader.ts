import NProgress from "nprogress";
import type { AnyRouter } from "@tanstack/react-router";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 120,
  minimum: 0.15,
  easing: "ease",
  speed: 300,
});

const MAX_DURATION_MS = 8000;

/**
 * Wire nprogress to TanStack Router lifecycle events.
 *
 * Start/done are paired regardless of `pathChanged` because TanStack Router
 * can resolve without re-emitting the same `pathChanged` value (preload
 * collisions, same-link clicks, redirects), which previously left the bar
 * stuck at the top. We also force-complete on `onError` and on a hard
 * timeout so a hung loader can never strand the bar.
 */
export function attachTopLoader(router: AnyRouter): () => void {
  let pending = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const finish = () => {
    pending = 0;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    NProgress.done();
  };

  const start = () => {
    pending += 1;
    NProgress.start();
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(finish, MAX_DURATION_MS);
  };

  const done = () => {
    pending = Math.max(0, pending - 1);
    if (pending === 0) finish();
  };

  const unsubBefore = router.subscribe("onBeforeNavigate", () => start());
  const unsubResolved = router.subscribe("onResolved", () => done());
  // onError is only fired in some Router versions; cast lets us subscribe
  // defensively without breaking the build if the event name is unknown.
  const unsubError = (
    router.subscribe as unknown as (
      ev: string,
      cb: () => void,
    ) => () => void
  )("onError", () => finish());

  return () => {
    unsubBefore();
    unsubResolved();
    unsubError();
    if (timeout) clearTimeout(timeout);
    NProgress.remove();
  };
}
