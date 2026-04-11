import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import ApplicationsPage from "#/pages/applications";

export const Route = createFileRoute("/_authenticated/applications/")({
  component: () => (
    <Layout
      title="Applications"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Applications" },
      ]}
    >
      <ApplicationsPage />
    </Layout>
  ),
});
