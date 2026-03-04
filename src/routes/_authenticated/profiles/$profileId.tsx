import { createFileRoute } from "@tanstack/react-router";

import { Layout } from "#/layouts";

export const Route = createFileRoute("/_authenticated/profiles/$profileId")({
  component: ProfileDetailPage,
});

function ProfileDetailPage() {
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
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Profile ID: <code className="rounded bg-muted px-1 py-0.5">{profileId}</code>
        </p>
        <p className="text-muted-foreground text-sm">
          Detail content can be implemented here (e.g. fetch profile by ID and display).
        </p>
      </div>
    </Layout>
  );
}
