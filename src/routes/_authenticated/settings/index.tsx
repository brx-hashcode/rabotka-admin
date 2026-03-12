import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import SettingsPage from "#/pages/settings-page";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: () => (
    <Layout
      title="Settings"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Settings" },
      ]}
    >
      <SettingsPage />
    </Layout>
  ),
});
