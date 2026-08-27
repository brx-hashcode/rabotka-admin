import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import OAuthAppsPage from "#/pages/oauth-apps";

export const Route = createFileRoute("/_authenticated/oauth-apps/")({
  component: () => (
    <Layout
      title="Applications"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Applications" },
      ]}
    >
      <OAuthAppsPage />
    </Layout>
  ),
});
