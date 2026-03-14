import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import TeamPage from "#/pages/team";

export const Route = createFileRoute("/_authenticated/team/")({
  component: () => (
    <Layout
      title="Team"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Team Members" }]}
    >
      <TeamPage />
    </Layout>
  ),
});
