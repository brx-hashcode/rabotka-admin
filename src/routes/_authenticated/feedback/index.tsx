import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import FeedbackPage from "#/pages/feedback";

export const Route = createFileRoute("/_authenticated/feedback/")({
  component: () => (
    <Layout
      title="User feedback"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Feedback" }]}
    >
      <FeedbackPage />
    </Layout>
  ),
});
