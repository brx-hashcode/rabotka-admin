import { createFileRoute } from "@tanstack/react-router";

import DashboardPage from "#/pages/dashboard";
import { DashboardLayout } from "#/features/dashboard";

export const Route = createFileRoute("/_authenticated/")({
  component: () => (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  ),
});
