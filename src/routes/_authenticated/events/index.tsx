import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import EventsPage from "#/pages/events";

export const Route = createFileRoute("/_authenticated/events/")({
  component: () => (
    <Layout
      title="HR Events"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "HR Events" },
      ]}
    >
      <EventsPage />
    </Layout>
  ),
});
