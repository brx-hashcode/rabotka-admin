import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import CollaborationGraphPage from "#/pages/collaboration-graph";

export const Route = createFileRoute("/_authenticated/network/")({
  component: () => (
    <Layout
      title="Network"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Network" }]}
    >
      <CollaborationGraphPage />
    </Layout>
  ),
});
