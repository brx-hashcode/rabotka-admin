import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";

export const Route = createFileRoute("/_authenticated/penalties/$penaltyId")({
  component: PenaltyDetailPage,
});

function PenaltyDetailPage() {
  const { penaltyId } = Route.useParams();

  return (
    <Layout
      title="Penalty"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Penalties", href: "/penalties" },
        { label: "Penalty" },
      ]}
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Penalty ID:{" "}
          <code className="rounded bg-muted px-1 py-0.5">{penaltyId}</code>
        </p>
        <p className="text-muted-foreground text-sm">
          Detail content can be implemented here (e.g. fetch penalty by ID and
          display).
        </p>
      </div>
    </Layout>
  );
}
