import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import NotificationsPage from "#/pages/notifications";

export const Route = createFileRoute("/_authenticated/notifications/")({
  component: () => (
    <Layout
      title="Notifications"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Notifications" },
      ]}
    >
      <NotificationsPage />
    </Layout>
  ),
});
