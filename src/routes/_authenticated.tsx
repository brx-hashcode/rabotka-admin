import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe, type Admin } from "#/lib/api/auth-controller";
import { ensureCsrfToken } from "#/lib/api/csrf-token";
import { getQueryClient } from "#/app/providers";
import { canViewRoute, landingRouteFor } from "#/lib/role-access";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    let me: Admin;
    try {
      me = await getQueryClient().ensureQueryData({
        queryKey: ["admin", "me"],
        queryFn: getMe,
      });
      await ensureCsrfToken();
    } catch {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }

    // Hiding a sidebar link does not make its URL unreachable. Lateral roles
    // own a narrow slice of the product, so send them back to their own landing
    // page rather than letting them open a screen that will only 403.
    if (!canViewRoute(me.role, location.pathname)) {
      throw redirect({ to: landingRouteFor(me.role) });
    }
  },

  component: Outlet,
});
