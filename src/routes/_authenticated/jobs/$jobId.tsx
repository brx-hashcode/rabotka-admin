import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();

  return (
    <Layout
      title="Job"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Jobs", href: "/jobs" },
        { label: "Job" },
      ]}
    >
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Job ID: <code className="rounded bg-muted px-1 py-0.5">{jobId}</code>
        </p>
        <p className="text-muted-foreground text-sm">
          Detail content can be implemented here (e.g. fetch job by ID and display).
        </p>
      </div>
    </Layout>
  );
}
