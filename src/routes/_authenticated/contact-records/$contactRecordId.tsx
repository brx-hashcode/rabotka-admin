import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import ContactRecordDetailPage from "#/pages/contact-record-detail-page";

export const Route = createFileRoute(
  "/_authenticated/contact-records/$contactRecordId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { contactRecordId } = Route.useParams();

  return (
    <Layout
      title="Paid contact"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Paid contacts", back: true },
        { label: "Contact details" },
      ]}
    >
      <ContactRecordDetailPage contactRecordId={contactRecordId} />
    </Layout>
  );
}
