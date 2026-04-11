import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import JobCategoriesPage from "#/pages/job-categories";

export const Route = createFileRoute("/_authenticated/job-categories/")({
  component: () => (
    <Layout
      title="Job Categories"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Job Categories" },
      ]}
    >
      <JobCategoriesPage />
    </Layout>
  ),
});
