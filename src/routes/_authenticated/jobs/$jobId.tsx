import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import JobDetailPage from "#/pages/job-detail-page";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { jobId } = Route.useParams();

  return (
    <Layout
      title="Job Offer"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Jobs", href: "/jobs" },
        { label: "Job Details" },
      ]}
    >
      <JobDetailPage jobId={jobId} />
    </Layout>
  );
}
