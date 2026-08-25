import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import ReferralsPage from "#/pages/referrals";

export const Route = createFileRoute("/_authenticated/referrals/")({
  component: () => (
    <Layout
      title="Parrainage"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Parrainage" }]}
    >
      <ReferralsPage />
    </Layout>
  ),
});
