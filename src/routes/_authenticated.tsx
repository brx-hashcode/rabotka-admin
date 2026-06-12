import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe } from "#/lib/api/auth-controller";
import { ensureCsrfToken } from "#/lib/api/csrf-token";
import { getQueryClient } from "#/app/providers";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    try {
      await getQueryClient().ensureQueryData({
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
  },

  component: Outlet,
});
