import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import ChatPage from "#/pages/chat";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: () => (
    <Layout
      title="Chat"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Chat" }]}
      fullBleed
    >
      <ChatPage />
    </Layout>
  ),
});
