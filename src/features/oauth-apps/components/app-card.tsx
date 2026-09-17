import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ChartColumn,
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
import { Button } from "#/components/ui/button";
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
import { AppStatsSheet } from "./app-stats-sheet";

type AppCardProps = {
  app: OAuthApp;
  onSecretMinted: (secret: MintedSecret) => void;
};

export function AppCard({ app, onSecretMinted }: Readonly<AppCardProps>) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [identityCheckOpen, setIdentityCheckOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "oauth-apps"] });

  const { mutate: doRotate, isPending: isRotating } = useMutation({
    mutationFn: () => rotateOAuthAppSecret(app.id),
    onSuccess: (secret) => {
      invalidate();
      setRotateOpen(false);
      onSecretMinted(secret);
    },
    onError: () => toast.error("Couldn't create a new app password. Try again."),
  });

  const { mutate: doToggle, isPending: isToggling } = useMutation({
    mutationFn: () =>
      app.status === "ACTIVE"
        ? suspendOAuthApp(app.id)
        : reactivateOAuthApp(app.id),
    onSuccess: () => {
      invalidate();
      toast.success(
        app.status === "ACTIVE" ? "Partner app paused" : "Partner app turned back on",
      );
    },
    onError: () => toast.error("Couldn't change this app. Try again."),
  });

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteOAuthApp(app.id),
    onSuccess: () => {
      invalidate();
      toast.success("Partner app deleted");
    },
    onError: () => toast.error("Couldn't delete this app. Try again."),
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
              {app.isSandbox && <Badge variant="secondary">Test app</Badge>}
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {app.description}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Stats"
            title="Stats"
            onClick={() => setStatsOpen(true)}
          >
            <ChartColumn className="size-4" />
          </Button>
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
                New app password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatsOpen(true)}>
                <ChartColumn className="size-4" />
                Stats
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIdentityCheckOpen(true)}>
                <ShieldCheck className="size-4" />
                Identity check
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => doToggle()} disabled={isToggling}>
                {isSuspended ? (
                  <>
                    <Play className="size-4" />
                    Turn back on
                  </>
                ) : (
                  <>
                    <Pause className="size-4" />
                    Pause
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <CopyableRow label="App ID" value={app.clientId} />
          <SecretRow app={app} />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">People signed in</span>
            <span className="flex items-center gap-1.5">
              <Users className="text-muted-foreground size-3" />
              <span className={app.userCount === 0 ? "text-muted-foreground" : ""}>
                {connectedLabel(app)}
              </span>
            </span>
          </div>
          {hasIdentityCheck(app.allowedScopes) && app.webhookUrl && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground shrink-0">Results sent to</span>
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
            The old app password still works until{" "}
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

      <AppStatsSheet app={app} open={statsOpen} onOpenChange={setStatsOpen} />

      <IdentityCheckDialog
        app={app}
        open={identityCheckOpen}
        onOpenChange={setIdentityCheckOpen}
      />

      <AlertDialog open={rotateOpen} onOpenChange={setRotateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a new app password?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll get a new password to send to {app.name}. The current one
              keeps working for 24 hours so they have time to switch — let them
              know before then.
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
            <AlertDialogTitle>Delete {app.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {app.userCount > 0
                ? `${app.userCount} ${app.userCount === 1 ? "person has" : "people have"} signed in with this app. Deleting it cancels their permission and signs them out of it right away.`
                : "Nobody will be able to use this app from now on."}{" "}
              Pausing can be undone; deleting cannot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => doDelete()}
              disabled={isDeleting}
            >
              Delete
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
  "Create a new app password once to be able to copy it.";

function connectedLabel(app: OAuthApp): string {
  if (app.isSandbox) return "Test accounts only";
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
        toast.success("App password copied");
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
      toast.error("Couldn't get the app password. Try again.");
    },
  });

  if (state === "hidden") {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">App password</span>
        <code className="font-mono">••••{app.clientSecretHint}</code>
      </div>
    );
  }

  const needsRotation = state === "needs-rotation";

  return (
    <>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground shrink-0">App password</span>
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
            aria-label="Copy app password"
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
            Your browser didn't allow copying. Copy it from here:
          </p>
          <div className="flex items-center gap-1">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">
              {fallback}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              aria-label="Copy app password"
              onClick={() => {
                navigator.clipboard
                  .writeText(fallback)
                  .then(() => {
                    toast.success("App password copied");
                    setFallback(null);
                  })
                  .catch(() => toast.error("Couldn't copy. Select the text and copy it yourself."));
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
              .catch(() => toast.error("Couldn't copy. Select the text and copy it yourself."));
          }}
        >
          <Copy className="size-3" />
        </Button>
      </div>
    </div>
  );
}
