import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";
import ProfileDetailPage from "#/pages/profile-detail-page";

export const Route = createFileRoute("/_authenticated/profiles/$profileId")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profileId } = Route.useParams();

  return (
    <Layout
      title="Profile"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Profiles", href: "/profiles" },
        { label: "Profile" },
      ]}
    >
      <ProfileDetailPage profileId={profileId} />
    </Layout>
  );
}
