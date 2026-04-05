import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import DocumentsPage from "#/pages/documents";

export const Route = createFileRoute("/_authenticated/documents/")({
  component: () => (
    <Layout
      title="Documents"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Documents" },
      ]}
    >
      <DocumentsPage />
    </Layout>
  ),
});
