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
      if (isExpiring()) {
        throw redirect({
          to: "/auth/login",
          search: {
            redirect: location.href,
          },
        });
      }
      throw error;
    }

    if (!canViewRoute(me.role, location.pathname)) {
      throw redirect({ to: landingRouteFor(me.role) });
    }
  },

  component: Outlet,
});
