import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import BroadcastDetailPage from "#/pages/broadcast-detail-page";

export const Route = createFileRoute("/_authenticated/broadcasts/$broadcastId")(
  {
    component: () => (
      <Layout
        title="Broadcast"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Broadcasts", href: "/broadcasts" },
          { label: "Detail" },
        ]}
      >
        <BroadcastDetailPage />
      </Layout>
    ),
  },
);
