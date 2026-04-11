import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import ClaimsPage from "#/pages/claims";

export const Route = createFileRoute("/_authenticated/claim/")({
  component: () => (
    <Layout
      title="Expense Claims"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Expense Claims" },
      ]}
    >
      <ClaimsPage />
    </Layout>
  ),
});
