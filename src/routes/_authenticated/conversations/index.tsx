import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import ConversationsPage from "#/pages/conversations";

export const Route = createFileRoute("/_authenticated/conversations/")({
  component: () => (
    <Layout
      title="Conversations"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Conversations" },
      ]}
    >
      <ConversationsPage />
    </Layout>
  ),
});
