import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import ContactRecordsPage from "#/pages/contact-records";

export const Route = createFileRoute("/_authenticated/contact-records/")({
  component: () => (
    <Layout
      title="Paid contacts"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Paid contacts" },
      ]}
    >
      <ContactRecordsPage />
    </Layout>
  ),
});
