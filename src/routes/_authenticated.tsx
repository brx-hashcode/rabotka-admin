import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe, type Admin } from "#/lib/api/auth-controller";
import { ensureCsrfToken } from "#/lib/api/csrf-token";
import { getQueryClient } from "#/app/providers";
import { canViewRoute, landingRouteFor } from "#/lib/role-access";
import { isExpiring } from "#/lib/auth/session";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    let me: Admin;
    try {
      me = await getQueryClient().ensureQueryData({
        queryKey: ["admin", "me"],
        queryFn: getMe,
      });
      await ensureCsrfToken();
    } catch (error) {
      // Only a dead session sends you to login. This catch used to be
      // indiscriminate, so a network blip on /me, a 500, or a dev-proxy hiccup
      // all looked identical to expiry — and the login page's own beforeLoad
      // then failed the same way, leaving you at a login form for a session you
      // still had.
      //
      // Pivots on isExpiring(), NOT is401(error): getMe goes through
      // auth-controller's handleError, which rethrows `new Error(message)` and
      // drops statusCode, so is401 would return false here. guard401 already ran
      // on the raw error inside AdminBaseController.get and set the flag.
      //
      // The interceptor has already started a hard navigation to the same URL;
      // this redirect is kept as the fallback for when that is blocked. Both
      // converge, so the login form renders once.
      if (isExpiring()) {
        throw redirect({
          to: "/auth/login",
          search: {
            redirect: location.href,
          },
        });
      }
      // A real fault — let the error boundary say so, with its reload button.
      throw error;
    }

    if (!canViewRoute(me.role, location.pathname)) {
      throw redirect({ to: landingRouteFor(me.role) });
    }
  },

  component: Outlet,
});
