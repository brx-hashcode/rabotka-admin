import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import BroadcastComposerPage from "#/pages/broadcast-composer";

export const Route = createFileRoute("/_authenticated/broadcasts/new")({
  component: () => (
    <Layout
      title="New broadcast"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Broadcasts", href: "/broadcasts" },
        { label: "New" },
      ]}
    >
      <BroadcastComposerPage />
    </Layout>
  ),
});
