import { createFileRoute } from "@tanstack/react-router";

import TeamPage from "#/pages/team";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
});
