import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import ConversationDetailPage from "#/pages/conversation-detail-page";

export const Route = createFileRoute(
  "/_authenticated/conversations/$conversationId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { conversationId } = Route.useParams();

  return (
    <Layout
      title="Conversation"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Conversations", back: true },
        { label: "Conversation" },
      ]}
    >
      <ConversationDetailPage conversationId={conversationId} />
    </Layout>
  );
}
