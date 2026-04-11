import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import JobsPage from "#/pages/jobs";

export const Route = createFileRoute("/_authenticated/jobs/")({
  component: () => (
    <Layout
      title="Job Openings"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Job Openings" },
      ]}
    >
      <JobsPage />
    </Layout>
  ),
});
