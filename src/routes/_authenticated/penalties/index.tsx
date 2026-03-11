import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import PenaltiesPage from "#/pages/penalties";

export const Route = createFileRoute("/_authenticated/penalties/")({
  component: () => (
    <Layout
      title="Penalties"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Penalties" },
      ]}
    >
      <PenaltiesPage />
    </Layout>
  ),
});
