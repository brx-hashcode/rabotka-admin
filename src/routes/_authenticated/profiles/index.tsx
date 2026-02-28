import { createFileRoute } from "@tanstack/react-router";

import ProfilesPage from "#/pages/profiles";
import { DashboardLayout } from "#/features/dashboard";

export const Route = createFileRoute("/_authenticated/profiles/")({
  component: () => (
    <DashboardLayout>
      <ProfilesPage />
    </DashboardLayout>
  ),
});
