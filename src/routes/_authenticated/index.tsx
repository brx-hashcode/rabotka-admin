import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import DashboardPage from "#/pages/dashboard";

export const Route = createFileRoute("/_authenticated/")({
  component: () => (
    <Layout>
      <DashboardPage />
    </Layout>
  ),
});
