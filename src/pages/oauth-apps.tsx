import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Plus } from "lucide-react";
import { PageListHeader } from "#/components/page-list-header";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import { AppCard } from "#/features/oauth-apps/components/app-card";
import { CreateAppModal } from "#/features/oauth-apps/components/create-app-modal";
import { SecretRevealDialog } from "#/features/oauth-apps/components/secret-reveal-dialog";
import {
  listOAuthApps,
  type MintedSecret,
} from "#/lib/api/oauth-apps-controller";

/**
 * Partner applications for "Login with Rabotka".
 *
 * Registration lives here rather than being self-service because a `client_id`
 * is Rabotka agreeing to vouch for its users' identities to whoever holds it.
 * SUPER_ADMIN only, enforced by the API and mirrored in the sidebar and
 * `role-access.ts`.
 */
export default function OAuthAppsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  /**
   * Held in state because it exists nowhere else — the server keeps only a hash
   * and there is no endpoint that reads a secret back. It is cleared the moment
   * the admin acknowledges the reveal dialog.
   */
  const [mintedSecret, setMintedSecret] = useState<MintedSecret | null>(null);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["admin", "oauth-apps"],
    queryFn: () => listOAuthApps(),
  });

  let listSection: ReactNode;

  if (isLoading) {
    listSection = (
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`app-skeleton-${i + 1}`} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  } else if (apps.length === 0) {
    listSection = (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="bg-muted rounded-full p-5">
          <KeyRound className="text-muted-foreground size-10" />
        </div>
        <p className="text-lg font-medium">No applications yet</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Register a partner application to let it authenticate Rabotka users
          and read their verification status.
        </p>
        <Button className="mt-2" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Register an application
        </Button>
      </div>
    );
  } else {
    // No `items-start` here, unlike the skeleton above: cards carry optional
    // rows — a last sign-in, a rotation notice — so letting each size to its
    // own content leaves a row of ragged bottoms. Stretching is grid's default;
    // the card fills the cell and pins its scopes to the bottom.
    listSection = (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} onSecretMinted={setMintedSecret} />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageListHeader
        title="Applications"
        description="Applications that can sign users in with Rabotka."
        actions={
          apps.length > 0 ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Register
            </Button>
          ) : null
        }
      />

      {listSection}

      <CreateAppModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={setMintedSecret}
      />

      <SecretRevealDialog
        secret={mintedSecret}
        onClose={() => setMintedSecret(null)}
      />
    </>
  );
}
