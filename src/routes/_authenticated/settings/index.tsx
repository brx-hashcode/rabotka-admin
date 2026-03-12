import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import SettingsPage from "#/pages/settings-page";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: () => (
    <Layout
      title="Paramètres"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Paramètres" },
      ]}
    >
      <SettingsPage />
    </Layout>
  ),
});
