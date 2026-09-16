import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import {
  updateOAuthApp,
  type OAuthApp,
} from "#/lib/api/oauth-apps-controller";
import {
  hasIdentityCheck,
  webhookUrlProblem,
  withIdentityCheck,
} from "../identity-check";

type IdentityCheckDialogProps = {
  app: OAuthApp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Turns the identity-check API on or off for an existing app, together with
 * its webhook. Both go in one PATCH: the API checks them as a pair, so
 * enabling first and adding the URL second would be refused.
 */
export function IdentityCheckDialog({
  app,
  open,
  onOpenChange,
}: Readonly<IdentityCheckDialogProps>) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(hasIdentityCheck(app.allowedScopes));
  const [webhookUrl, setWebhookUrl] = useState(app.webhookUrl ?? "");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEnabled(hasIdentityCheck(app.allowedScopes));
    setWebhookUrl(app.webhookUrl ?? "");
    setTouched(false);
  }, [open, app.allowedScopes, app.webhookUrl]);

  const problem = enabled ? webhookUrlProblem(webhookUrl, app.isSandbox) : null;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateOAuthApp(app.id, {
        allowedScopes: withIdentityCheck(app.allowedScopes, enabled),
        // Cleared with the switch, so a disabled app keeps no stale endpoint.
        webhookUrl: enabled ? webhookUrl.trim() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "oauth-apps"] });
      toast.success(
        enabled ? "Identity checks enabled" : "Identity checks disabled",
      );
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(messageFrom(error) ?? "Failed to save");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Identity check API</DialogTitle>
          <DialogDescription>
            {app.name} sends a WhatsApp number and a name. The person approves
            the request on their phone, and {app.name} receives a match score —
            never the profile itself.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (!problem) mutate();
          }}
        >
          <label className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium">Enabled</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </label>

          {enabled && (
            <div className="space-y-1.5">
              <Label htmlFor="identity-check-webhook">Webhook URL</Label>
              <Input
                id="identity-check-webhook"
                className="font-mono text-xs"
                placeholder="https://partner.com/webhooks/rabotka"
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && problem !== null}
              />
              {touched && problem ? (
                <p className="text-destructive text-xs">{problem}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Required. Receives each result as a JWS signed with the
                  Rabotka OIDC key.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function messageFrom(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const body = (
    error as { body?: { message?: string | string[]; error_description?: string } }
  ).body;
  const message = Array.isArray(body?.message)
    ? body.message.join(", ")
    : body?.message;
  return body?.error_description ?? message ?? null;
}
