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
  reactivateOAuthApp,
  rotateOAuthAppSecret,
  suspendOAuthApp,
  type MintedSecret,
  type OAuthApp,
} from "#/lib/api/oauth-apps-controller";
import { scopeLabel } from "../scopes";

type AppCardProps = {
  app: OAuthApp;
  onSecretMinted: (secret: MintedSecret) => void;
};

export function AppCard({ app, onSecretMinted }: Readonly<AppCardProps>) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);

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
      <div className="bg-card shadow-soft flex flex-col gap-4 rounded-lg p-5">
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
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Client secret</span>
            <code className="font-mono">••••{app.clientSecretHint}</code>
          </div>
        </div>

        {app.previousSecretExpiresAt && (
          // Only rendered while a rotation is still in its grace window, so its
          // presence is the signal: two secrets are live right now.
          <p className="text-muted-foreground bg-muted rounded-md p-2 text-xs">
            Previous secret still valid until{" "}
            {format(new Date(app.previousSecretExpiresAt), "d MMM, HH:mm")}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {app.allowedScopes
            .filter((scope) => scope !== "openid")
            .map((scope) => (
              <Badge key={scope} variant="secondary" className="font-normal">
                {scopeLabel(scope)}
              </Badge>
            ))}
        </div>

        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {app.userCount} {app.userCount === 1 ? "user" : "users"}
          </span>
          <span>{format(new Date(app.createdAt), "d MMM yyyy")}</span>
        </div>
      </div>

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
