import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";

export const Route = createFileRoute(
  "/_authenticated/applications/$applicationId",
)({
  component: ApplicationDetailPage,
});

function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();

  return (
    <Layout
      title="Application"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Applications", href: "/applications" },
        { label: "Application" },
      ]}
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Application ID:{" "}
          <code className="rounded bg-muted px-1 py-0.5">{applicationId}</code>
        </p>
        <p className="text-muted-foreground text-sm">
          Detail content can be implemented here (e.g. fetch application by ID
          and display).
        </p>
      </div>
    </Layout>
  );
}
