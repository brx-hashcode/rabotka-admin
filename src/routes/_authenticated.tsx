import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMe } from "#/lib/api/auth-controller";
import { fetchAndSetCsrfToken } from "#/lib/api/csrf-token";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location: { pathname, search } }) => {
    try {
      await getMe();
      await fetchAndSetCsrfToken();
    } catch {
      throw redirect({
        to: "/auth/login",
        search: { from: pathname + search },
      });
    }
  },

  component: Outlet,
});
