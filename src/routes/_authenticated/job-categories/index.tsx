import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import JobCategoriesPage from "#/pages/job-categories";

export const Route = createFileRoute("/_authenticated/job-categories/")({
  component: () => (
    <Layout
      title="Domains"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Domains" }]}
    >
      <JobCategoriesPage />
    </Layout>
  ),
});
