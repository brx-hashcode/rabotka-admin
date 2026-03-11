import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import JobsPage from "#/pages/jobs";

export const Route = createFileRoute("/_authenticated/jobs/")({
  component: () => (
    <Layout
      title="Jobs"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Jobs" },
      ]}
    >
      <JobsPage />
    </Layout>
  ),
});
