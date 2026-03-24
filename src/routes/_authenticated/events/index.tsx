import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";

export const Route = createFileRoute("/_authenticated/events/")({
  component: () => (
    <Layout
      title="Events"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Events" },
      ]}
    >
      <div />
    </Layout>
  ),
});
