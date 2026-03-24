import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";

export const Route = createFileRoute("/_authenticated/claim/")({
  component: () => (
    <Layout
      title="Claim"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Claim" },
      ]}
    >
      <div />
    </Layout>
  ),
});
