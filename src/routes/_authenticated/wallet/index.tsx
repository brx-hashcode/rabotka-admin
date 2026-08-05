import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import WalletPage from "#/pages/wallet";

export const Route = createFileRoute("/_authenticated/wallet/")({
  component: () => (
    <Layout
      title="Finance"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Finance" },
      ]}
    >
      <WalletPage />
    </Layout>
  ),
});
