import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import EventsPage from "#/pages/events";

export const Route = createFileRoute("/_authenticated/events/")({
  component: () => (
    <Layout
      title="Events"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Events" },
      ]}
    >
      <EventsPage />
    </Layout>
  ),
});
