import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import AgentDetailPage from "#/pages/agent-detail-page";

export const Route = createFileRoute("/_authenticated/agents/$agentId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { agentId } = Route.useParams();

  return (
    <Layout
      title="Agent"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Agents", back: true },
        { label: "Agent Details" },
      ]}
    >
      <AgentDetailPage agentId={agentId} />
    </Layout>
  );
}
