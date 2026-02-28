import { createFileRoute } from "@tanstack/react-router";

import ApplicationsPage from "#/pages/applications";
import { DashboardLayout } from "#/features/dashboard";

export const Route = createFileRoute("/_authenticated/applications/")({
  component: () => (
    <DashboardLayout>
      <ApplicationsPage />
    </DashboardLayout>
  ),
});
