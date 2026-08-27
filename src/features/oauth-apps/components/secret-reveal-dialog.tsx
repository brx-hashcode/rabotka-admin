import { useState } from "react";
import { Copy, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import type { MintedSecret } from "#/lib/api/oauth-apps-controller";

type SecretRevealDialogProps = {
  secret: MintedSecret | null;
  onClose: () => void;
};

/**
 * The one and only time a client secret is visible.
 *
 * Rabotka stores a SHA-256 of the secret and nothing else, so there is no code
 * path — not in the admin, not in the database, not for an engineer — that can
 * show it again. That makes this dialog's job unusually specific: it has to
 * make an admin who is skimming actually stop and copy, because the recovery
 * path for not doing so is rotating the secret and interrupting the partner.
 *
 * Hence: no close button in the corner, an explicit "I have copied it"
 * acknowledgement, and the warning above the value rather than below it.
 */
export function SecretRevealDialog({
  secret,
  onClose,
}: Readonly<SecretRevealDialogProps>) {
  const [copied, setCopied] = useState(false);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
    } catch {
      // Clipboard access is refused in some browser configurations, and the
      // value is on screen and selectable — so this is a nuisance, not a
      // failure worth blocking on.
      toast.error("Could not copy — select the value and copy it manually");
    }
  }

  return (
    <Dialog
      open={secret !== null}
      // Only the acknowledgement button closes this. An outside click or Escape
      // would dismiss the only copy of a credential that cannot be recovered.
      onOpenChange={() => undefined}
    >
      <DialogContent showClose={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Client credentials</DialogTitle>
          <DialogDescription>
            Send these to the partner over a channel you trust.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 rounded-lg bg-destructive/10 p-3 text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm leading-snug">
            {secret?.warning ??
              "Copy the secret now — it will never be shown again."}
          </p>
        </div>

        <div className="space-y-3">
          <CredentialRow
            label="Client ID"
            value={secret?.clientId ?? ""}
            onCopy={copy}
          />
          <CredentialRow
            label="Client secret"
            value={secret?.clientSecret ?? ""}
            onCopy={copy}
          />
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            disabled={!copied}
            onClick={() => {
              setCopied(false);
              onClose();
            }}
          >
            {copied
              ? "I have copied the secret"
              : "Copy the secret to continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
}: Readonly<{
  label: string;
  value: string;
  onCopy: (value: string, label: string) => void;
}>) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <div className="bg-muted flex items-center gap-2 rounded-lg p-2">
        {/*
          `break-all` and a real <code>: these are 40+ characters of base64url
          with no spaces, and any truncation here would let someone copy a
          partial secret from the screen without noticing.
        */}
        <code className="min-w-0 flex-1 break-all font-mono text-xs">
          {value}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={`Copy ${label}`}
          onClick={() => onCopy(value, label)}
        >
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}
