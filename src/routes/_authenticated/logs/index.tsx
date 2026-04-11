import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import LogsPage from "#/pages/logs";

export const Route = createFileRoute("/_authenticated/logs/")({
  component: () => (
    <Layout
      title="Activity Logs"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Activity Logs" },
      ]}
    >
      <LogsPage />
    </Layout>
  ),
});
