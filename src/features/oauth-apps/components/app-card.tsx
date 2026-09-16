import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Copy,
  KeyRound,
  MoreHorizontal,
  Pause,
  Play,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import {
  deleteOAuthApp,
  readSandboxAppSecret,
  reactivateOAuthApp,
  rotateOAuthAppSecret,
  suspendOAuthApp,
  type MintedSecret,
  type OAuthApp,
} from "#/lib/api/oauth-apps-controller";
import { secretRowState } from "../secret-row-state";
import { httpStatusOf } from "#/lib/auth/session";
import { scopeLabel } from "../scopes";
import { IDENTITY_CHECK_SCOPE, hasIdentityCheck } from "../identity-check";
import { IdentityCheckDialog } from "./identity-check-dialog";

type AppCardProps = {
  app: OAuthApp;
  onSecretMinted: (secret: MintedSecret) => void;
};

export function AppCard({ app, onSecretMinted }: Readonly<AppCardProps>) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [identityCheckOpen, setIdentityCheckOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "oauth-apps"] });

  const { mutate: doRotate, isPending: isRotating } = useMutation({
    mutationFn: () => rotateOAuthAppSecret(app.id),
    onSuccess: (secret) => {
      invalidate();
      setRotateOpen(false);
      onSecretMinted(secret);
    },
    onError: () => toast.error("Failed to rotate the secret"),
  });

  const { mutate: doToggle, isPending: isToggling } = useMutation({
    mutationFn: () =>
      app.status === "ACTIVE"
        ? suspendOAuthApp(app.id)
        : reactivateOAuthApp(app.id),
    onSuccess: () => {
      invalidate();
      toast.success(
        app.status === "ACTIVE" ? "Application suspended" : "Application active",
      );
    },
    onError: () => toast.error("Failed to change the status"),
  });

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteOAuthApp(app.id),
    onSuccess: () => {
      invalidate();
      toast.success("Application removed");
    },
    onError: () => toast.error("Failed to remove the application"),
  });

  const isSuspended = app.status === "SUSPENDED";

  return (
    <>
      <div className="bg-card shadow-soft flex h-full flex-col gap-4 rounded-lg p-5">
        <div className="flex items-start gap-3">
          {app.logoUrl ? (
            <img
              src={app.logoUrl}
              alt=""
              className="size-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
              {app.name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{app.name}</p>
              {isSuspended && <Badge variant="destructive">Suspended</Badge>}
              {app.isSandbox && <Badge variant="secondary">Sandbox</Badge>}
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {app.description}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setRotateOpen(true)}
                disabled={isRotating}
              >
                <KeyRound className="size-4" />
                Rotate secret
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIdentityCheckOpen(true)}>
                <ShieldCheck className="size-4" />
                Identity check API
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => doToggle()} disabled={isToggling}>
                {isSuspended ? (
                  <>
                    <Play className="size-4" />
                    Reactivate
                  </>
                ) : (
                  <>
                    <Pause className="size-4" />
                    Suspend
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <CopyableRow label="Client ID" value={app.clientId} />
          <SecretRow app={app} />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Connected</span>
            <span className="flex items-center gap-1.5">
              <Users className="text-muted-foreground size-3" />
              <span className={app.userCount === 0 ? "text-muted-foreground" : ""}>
                {connectedLabel(app)}
              </span>
            </span>
          </div>
          {hasIdentityCheck(app.allowedScopes) && app.webhookUrl && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">Webhook</span>
              <code className="truncate font-mono">{app.webhookUrl}</code>
            </div>
          )}
          {app.lastUsedAt && (
            // Only when it has actually been used. "Never" is already carried
            // by a connected count of zero, and a second line saying so would
            // be the same fact twice.
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last sign-in</span>
              <span>{format(new Date(app.lastUsedAt), "d MMM, HH:mm")}</span>
            </div>
          )}
        </div>

        {app.previousSecretExpiresAt && (
          // Only rendered while a rotation is still in its grace window, so its
          // presence is the signal: two secrets are live right now.
          <p className="text-muted-foreground bg-muted rounded-md p-2 text-xs">
            Previous secret still valid until{" "}
            {format(new Date(app.previousSecretExpiresAt), "d MMM, HH:mm")}
          </p>
        )}

        {/*
          `mt-auto` collects the slack from equal-height cards here, at the
          bottom. Without it a card with fewer rows than its neighbours spreads
          that space through `gap-4`, and the scopes float mid-card while the
          detail rows drift apart from each other.
        */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {app.allowedScopes
            .filter((scope) => scope !== "openid")
            .map((scope) => (
              <Badge
                key={scope}
                variant={scope === IDENTITY_CHECK_SCOPE ? "default" : "secondary"}
                className="font-normal"
              >
                {scopeLabel(scope)}
              </Badge>
            ))}
        </div>
      </div>

      <IdentityCheckDialog
        app={app}
        open={identityCheckOpen}
        onOpenChange={setIdentityCheckOpen}
      />

      <AlertDialog open={rotateOpen} onOpenChange={setRotateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate the client secret?</AlertDialogTitle>
            <AlertDialogDescription>
              A new secret is issued immediately. The current one keeps working
              for 24 hours so {app.name} can redeploy without downtime — tell
              them before the window closes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => doRotate()} disabled={isRotating}>
              Rotate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {app.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {app.userCount > 0
                ? `${app.userCount} ${app.userCount === 1 ? "person has" : "people have"} signed in with this app. Removing it revokes every one of those consents and signs them out of it immediately.`
                : "Sign-in through this application stops immediately."}{" "}
              Suspending is reversible; this is not.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => doDelete()}
              disabled={isDeleting}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * How many people are signed in to this application.
 *
 * A sandbox app is reported as not applicable rather than as zero: it writes no
 * consent records by design, so "0 people" would read as a failed integration
 * when it is the expected and only possible answer.
 */
/** Said in two places — the muted button and a 409 from a stale list. */
const ROTATE_TO_ENABLE =
  "Rotate this app's secret once to make it copyable.";

function connectedLabel(app: OAuthApp): string {
  if (app.isSandbox) return "Sandbox users only";
  if (app.userCount === 0) return "No one yet";
  return `${app.userCount} ${app.userCount === 1 ? "person" : "people"}`;
}

/**
 * The "Client secret" row.
 *
 * A sibling of `CopyableRow` rather than more props on it: there the displayed
 * text IS the copied text, the copy is synchronous, and there is no failure
 * state. Here the displayed text (`••••1a2b`) is never what gets copied, the
 * value arrives over the network, and there is a third "not copyable yet"
 * state. Threading that through would leave `CopyableRow` with three optional
 * props exercised by one caller and a `value` that no longer means its name.
 */
function SecretRow({ app }: Readonly<{ app: OAuthApp }>) {
  const state = secretRowState(app);
  // Only ever set when the clipboard itself refused — see the comment on the
  // failure branch below. The happy path never puts the secret in state.
  const [fallback, setFallback] = useState<string | null>(null);

  const { mutate: reveal, isPending } = useMutation({
    mutationFn: () => readSandboxAppSecret(app.id),
    // A mutation, not a query: the server writes an audit row per read, so this
    // must be one fetch per click. A query would also cache the secret where
    // `@tanstack/react-devtools` can read it, and `refetchOnWindowFocus` would
    // silently re-read — and re-audit — on every tab switch.
    onSuccess: async ({ clientSecret }) => {
      try {
        await navigator.clipboard.writeText(clientSecret);
        toast.success("Client secret copied");
      } catch {
        // Safari treats the awaited network round trip as having consumed the
        // click's user activation, so the write is refused there every time —
        // "try again" would loop forever. Showing the value gives a fresh
        // gesture to copy from. This is the only path that holds the secret.
        setFallback(clientSecret);
      }
    },
    onError: (error: unknown) => {
      // 409 is the server saying "sandbox app, but nothing stored" — reachable
      // from a list that went stale after someone rotated elsewhere. Read
      // through the shared helper rather than off `error.status`: the SDK puts
      // it on `statusCode`.
      if (httpStatusOf(error) === 409) {
        toast.info(ROTATE_TO_ENABLE);
        return;
      }
      toast.error("Could not read the client secret");
    },
  });

  if (state === "hidden") {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Client secret</span>
        <code className="font-mono">••••{app.clientSecretHint}</code>
      </div>
    );
  }

  const needsRotation = state === "needs-rotation";

  return (
    <>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground shrink-0">Client secret</span>
        <div className="flex min-w-0 items-center gap-1">
          <code className="truncate font-mono">••••{app.clientSecretHint}</code>
          <Button
            variant="ghost"
            size="icon"
            className={`size-6 shrink-0 ${needsRotation ? "text-muted-foreground" : ""}`}
            // `aria-disabled`, not `disabled`: a really disabled button swallows
            // pointer events, so the explanation would need a tooltip on a
            // wrapper — and a tooltip does not exist on touch. One click handler
            // that always fires works on every input.
            aria-disabled={needsRotation || undefined}
            aria-label="Copy client secret"
            onClick={() => {
              if (needsRotation) {
                toast.info(ROTATE_TO_ENABLE);
                return;
              }
              if (!isPending) reveal();
            }}
          >
            <Copy className="size-3" />
          </Button>
        </div>
      </div>

      {fallback !== null && (
        <div className="bg-muted space-y-2 rounded-md p-2">
          <p className="text-muted-foreground text-xs">
            Your browser blocked the automatic copy. Copy it from here:
          </p>
          <div className="flex items-center gap-1">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">
              {fallback}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              aria-label="Copy client secret"
              onClick={() => {
                navigator.clipboard
                  .writeText(fallback)
                  .then(() => {
                    toast.success("Client secret copied");
                    setFallback(null);
                  })
                  .catch(() => toast.error("Could not copy"));
              }}
            >
              <Copy className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function CopyableRow({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="flex min-w-0 items-center gap-1">
        <code className="truncate font-mono">{value}</code>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0"
          aria-label={`Copy ${label}`}
          onClick={() => {
            navigator.clipboard
              .writeText(value)
              .then(() => toast.success(`${label} copied`))
              .catch(() => toast.error("Could not copy"));
          }}
        >
          <Copy className="size-3" />
        </Button>
      </div>
    </div>
  );
}
