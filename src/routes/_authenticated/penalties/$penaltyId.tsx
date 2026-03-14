import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import PenaltyDetailPage from "#/pages/penalty-detail-page";

export const Route = createFileRoute("/_authenticated/penalties/$penaltyId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { penaltyId } = Route.useParams();

  return (
    <Layout
      title="Penalty"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Penalties", back: true },
        { label: "Penalty Details" },
      ]}
    >
      <PenaltyDetailPage penaltyId={penaltyId} />
    </Layout>
  );
}
