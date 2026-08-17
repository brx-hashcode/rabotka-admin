import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import WhatsappPage from "#/pages/whatsapp";

export const Route = createFileRoute("/_authenticated/whatsapp/")({
  component: () => (
    <Layout
      title="WhatsApp"
      breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "WhatsApp" }]}
    >
      <WhatsappPage />
    </Layout>
  ),
});
