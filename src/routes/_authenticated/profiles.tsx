import { createFileRoute } from "@tanstack/react-router";

import ProfilesPage from "#/pages/profiles";

export const Route = createFileRoute("/_authenticated/profiles")({
  component: ProfilesPage,
});
