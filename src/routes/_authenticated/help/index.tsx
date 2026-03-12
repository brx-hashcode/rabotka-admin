import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import HelpPage from "#/pages/help-page";

export const Route = createFileRoute("/_authenticated/help/")({
  component: () => (
    <Layout
      title="Support Center"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Support Center" },
      ]}
    >
      <HelpPage />
    </Layout>
  ),
});
