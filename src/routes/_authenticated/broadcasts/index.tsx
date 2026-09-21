import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import BroadcastsPage from "#/pages/broadcasts";

export const Route = createFileRoute("/_authenticated/broadcasts/")({
  component: () => (
    <Layout
      title="Broadcasts"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Broadcasts" }]}
    >
      <BroadcastsPage />
    </Layout>
  ),
});
