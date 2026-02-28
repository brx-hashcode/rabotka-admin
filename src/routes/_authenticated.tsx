import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    console.log("beforeLoad check for the user auth status");
  },

  component: Outlet,
});
