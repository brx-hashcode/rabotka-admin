import { createFileRoute } from "@tanstack/react-router";

import JobsPage from "#/pages/jobs";
import { DashboardLayout } from "#/features/dashboard";

export const Route = createFileRoute("/_authenticated/jobs/")({
  component: () => (
    <DashboardLayout>
      <JobsPage />
    </DashboardLayout>
  ),
});
