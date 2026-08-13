import { IconRefresh } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";

/**
 * Router-level fallback. Replaces TanStack Router's default error screen, which
 * shows a raw stack trace and offers no way out but a manual refresh.
 */
export function AppError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-1.5">
        <h1 className="font-semibold text-lg">Une erreur est survenue</h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          La page n'a pas pu se charger. Rechargez pour réessayer — si le
          problème persiste, vérifiez votre connexion.
        </p>
      </div>

      <Button onClick={() => window.location.reload()}>
        <IconRefresh />
        Recharger la page
      </Button>

      {import.meta.env.DEV && (
        <pre className="max-w-full overflow-x-auto text-left text-muted-foreground text-xs">
          {error.message}
        </pre>
      )}
    </div>
  );
}
