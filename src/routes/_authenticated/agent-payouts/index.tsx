import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import AgentPayoutsPage from "#/pages/agent-payouts-page";

export const Route = createFileRoute("/_authenticated/agent-payouts/")({
  component: () => (
    <Layout
      title="Agent payouts"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Agent payouts" },
      ]}
    >
      <AgentPayoutsPage />
    </Layout>
  ),
});
