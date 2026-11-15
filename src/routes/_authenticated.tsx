import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe, type Admin } from "#/lib/api/auth-controller";
import { getQueryClient } from "#/app/providers";
import { canViewRoute, landingRouteFor } from "#/lib/role-access";
import { isExpiring } from "#/lib/auth/session";
import { CallPanel } from "#/features/visio/call-panel";
import { IncomingCall } from "#/features/visio/incoming-call";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    let me: Admin;
    try {
      me = await getQueryClient().ensureQueryData({
        queryKey: ["admin", "me"],
        queryFn: getMe,
      });
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

  component: AuthenticatedShell,
});

/**
 * Every signed-in page, plus what outlives a page change: the call panel (a
 * call keeps going while you move around the admin) and the incoming-call ring.
 */
function AuthenticatedShell() {
  return (
    <>
      <Outlet />
      <CallPanel />
      <IncomingCall />
    </>
  );
}
