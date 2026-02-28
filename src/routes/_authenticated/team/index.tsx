import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import TeamPage from "#/pages/team";

export const Route = createFileRoute("/_authenticated/team/")({
  component: () => (
    <Layout
      title="Team"
      description="Coming soon."
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Team" },
      ]}
    >
      <TeamPage />
    </Layout>
  ),
});
