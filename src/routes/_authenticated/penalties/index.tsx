import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import PenaltiesPage from "#/pages/penalties";

export const Route = createFileRoute("/_authenticated/penalties/")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.payment_status;
    let payment_status: string[] = [];
    if (Array.isArray(raw)) {
      payment_status = raw as string[];
    } else if (raw) {
      payment_status = [raw as string];
    }
    return { payment_status };
  },
  component: () => (
    <Layout
      title="Penalties"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Penalties" }]}
    >
      <PenaltiesPage />
    </Layout>
  ),
});
