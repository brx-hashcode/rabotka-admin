import NProgress from "nprogress";
import type { AnyRouter } from "@tanstack/react-router";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 120,
  minimum: 0.15,
  easing: "ease",
  speed: 300,
});

/**
 * Wire nprogress to TanStack Router lifecycle events.
 * Mirrors the next-toploader UX: thin coloured bar at the top of the viewport
 * that starts on path-changing navigations and completes once data is loaded.
 */
export function attachTopLoader(router: AnyRouter): () => void {
  let pending = 0;

  const start = () => {
    pending += 1;
    NProgress.start();
  };

  const done = () => {
    pending = Math.max(0, pending - 1);
    if (pending === 0) NProgress.done();
  };

  const unsubBefore = router.subscribe("onBeforeNavigate", ({ pathChanged }) => {
    if (pathChanged) start();
  });
  const unsubResolved = router.subscribe("onResolved", ({ pathChanged }) => {
    if (pathChanged) done();
  });

  return () => {
    unsubBefore();
    unsubResolved();
    NProgress.remove();
  };
}
