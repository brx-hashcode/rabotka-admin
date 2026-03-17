import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import PenaltiesPage from "#/pages/penalties";

export const Route = createFileRoute("/_authenticated/penalties/")({
  validateSearch: (search: Record<string, unknown>) => ({
    payment_status: Array.isArray(search.payment_status)
      ? (search.payment_status as string[])
      : search.payment_status
        ? [search.payment_status as string]
        : [],
  }),
  component: () => (
    <Layout
      title="Penalties"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Violations & Penalties" },
      ]}
    >
      <PenaltiesPage />
    </Layout>
  ),
});
