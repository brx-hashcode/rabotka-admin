import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import AdsBundlesPage from "#/pages/ads-bundles";

export const Route = createFileRoute("/_authenticated/ads-bundles/")({
  component: () => (
    <Layout
      title="Ad Bundles"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Ad Bundles" },
      ]}
    >
      <AdsBundlesPage />
    </Layout>
  ),
});
