import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import ProfilesPage from "#/pages/profiles";

export const Route = createFileRoute("/_authenticated/profiles/")({
  component: () => (
    <Layout
      title="Profiles"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Candidate Profiles" },
      ]}
    >
      <ProfilesPage />
    </Layout>
  ),
});
