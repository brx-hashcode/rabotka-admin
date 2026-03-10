import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import PaymentRequestsPage from "#/pages/payment-requests";

export const Route = createFileRoute("/_authenticated/payment-requests/")({
  component: () => (
    <Layout
      title="Payment Requests"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Payment Requests" },
      ]}
    >
      <PaymentRequestsPage />
    </Layout>
  ),
});
