import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import FeedbackPage from "#/pages/feedback";

export const Route = createFileRoute("/_authenticated/feedback/")({
  component: () => (
    <Layout
      title="Avis utilisateurs"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Avis" }]}
    >
      <FeedbackPage />
    </Layout>
  ),
});
