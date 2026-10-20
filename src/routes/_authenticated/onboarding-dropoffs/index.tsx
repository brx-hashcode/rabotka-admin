import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import OnboardingDropoffsPage from "#/pages/onboarding-dropoffs";

export const Route = createFileRoute("/_authenticated/onboarding-dropoffs/")({
  component: () => (
    <Layout
      title="Inscriptions inachevées"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Inscriptions inachevées" },
      ]}
    >
      <OnboardingDropoffsPage />
    </Layout>
  ),
});
