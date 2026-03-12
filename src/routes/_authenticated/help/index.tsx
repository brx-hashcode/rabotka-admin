import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import HelpPage from "#/pages/help-page";

export const Route = createFileRoute("/_authenticated/help/")({
  component: () => (
    <Layout
      title="Aide"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Aide" },
      ]}
    >
      <HelpPage />
    </Layout>
  ),
});
