import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import AdminProfilePage from "#/pages/admin-profile-page";

export const Route = createFileRoute("/_authenticated/profile/")({
  component: () => (
    <Layout
      title="My Profile"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "My Profile" },
      ]}
    >
      <AdminProfilePage />
    </Layout>
  ),
});
