import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import DemoRequestDetailPage from "#/pages/demo-request-detail-page";

export const Route = createFileRoute(
  "/_authenticated/demo-requests/$demoRequestId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { demoRequestId } = Route.useParams();

  return (
    <Layout
      title="Demo request"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Demo requests", back: true },
        { label: "Request" },
      ]}
    >
      <DemoRequestDetailPage demoRequestId={demoRequestId} />
    </Layout>
  );
}
