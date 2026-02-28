import { createFileRoute } from "@tanstack/react-router";

import TeamPage from "#/pages/team";
import { DashboardLayout } from "#/features/dashboard";

export const Route = createFileRoute("/_authenticated/team/")({
  component: () => (
    <DashboardLayout>
      <TeamPage />
    </DashboardLayout>
  ),
});
