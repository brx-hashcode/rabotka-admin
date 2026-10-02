import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import AgentsPage from "#/pages/agents";

export const Route = createFileRoute("/_authenticated/agents/")({
  component: () => (
    <Layout
      title="Agents"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Agents" }]}
    >
      <AgentsPage />
    </Layout>
  ),
});
