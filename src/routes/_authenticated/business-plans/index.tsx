import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import BusinessPlansPage from "#/pages/business-plans";

export const Route = createFileRoute("/_authenticated/business-plans/")({
  component: () => (
    <Layout
      title="Business plans"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Business plans" },
      ]}
    >
      <BusinessPlansPage />
    </Layout>
  ),
});
