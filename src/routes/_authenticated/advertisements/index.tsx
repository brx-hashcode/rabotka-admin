import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import AdvertisementsPage from "#/pages/advertisements";

export const Route = createFileRoute("/_authenticated/advertisements/")({
  component: () => (
    <Layout
      title="Advertisements"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Advertisements" },
      ]}
    >
      <AdvertisementsPage />
    </Layout>
  ),
});
