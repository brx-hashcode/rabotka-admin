import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import LogsPage from "#/pages/logs";

export const Route = createFileRoute("/_authenticated/logs/")({
  component: () => (
    <Layout
      title="Logs"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Logs" },
      ]}
    >
      <LogsPage />
    </Layout>
  ),
});
