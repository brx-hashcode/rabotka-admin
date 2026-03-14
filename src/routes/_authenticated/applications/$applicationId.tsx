import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import ApplicationDetailPage from "#/pages/application-detail-page";

export const Route = createFileRoute(
  "/_authenticated/applications/$applicationId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { applicationId } = Route.useParams();

  return (
    <Layout
      title="Application"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Applications", back: true },
        { label: "Application Details" },
      ]}
    >
      <ApplicationDetailPage applicationId={applicationId} />
    </Layout>
  );
}
