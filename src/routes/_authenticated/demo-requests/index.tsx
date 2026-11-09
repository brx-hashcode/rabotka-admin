import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import DemoRequestsPage from "#/pages/demo-requests";

export const Route = createFileRoute("/_authenticated/demo-requests/")({
  component: () => (
    <Layout
      title="Demo requests"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Demo requests" },
      ]}
    >
      <DemoRequestsPage />
    </Layout>
  ),
});
