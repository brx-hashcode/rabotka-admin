import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "#/layouts";
import OnboardingDropoffsPage from "#/pages/onboarding-dropoffs";

export const Route = createFileRoute("/_authenticated/onboarding-dropoffs/")({
  component: () => (
    <Layout
      title="Sign-up drop-offs"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Sign-up drop-offs" },
      ]}
    >
      <OnboardingDropoffsPage />
    </Layout>
  ),
});
