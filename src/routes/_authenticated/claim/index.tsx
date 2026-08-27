import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import ClaimsPage from "#/pages/claims";

export const Route = createFileRoute("/_authenticated/claim/")({
  component: () => (
    <Layout
      title="Expense Claims"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Expense Claims" },
      ]}
      // The board owns the height: each column scrolls its own cards, so the
      // page itself must not grow past the viewport. `fullBleed` is what gives
      // the page a bounded, flex-able container; the padding it drops is put
      // back on the page root.
      fullBleed
    >
      <ClaimsPage />
    </Layout>
  ),
});
