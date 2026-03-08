import { useState, useEffect } from "react";

import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "#/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetStatus: "ACTIVE" | "SUSPENDED";
  onSubmit: (status: "ACTIVE" | "SUSPENDED", reason?: string) => void;
  isPending: boolean;
};

export function StatusVerificationModal({
  open,
  onOpenChange,
  targetStatus,
  onSubmit,
  isPending,
}: Readonly<Props>) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setReasonError(false);
    }
  }, [open]);

  const isSuspending = targetStatus === "SUSPENDED";

  const handleSubmit = () => {
    if (isSuspending && !reason.trim()) {
      setReasonError(true);
      return;
    }
    onSubmit(targetStatus, reason.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSuspending ? "Suspend Account" : "Activate Account"}
          </DialogTitle>
          <DialogDescription>
            {isSuspending
              ? "This will suspend the account and restrict access."
              : "This will activate the account and grant full access."}{" "}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Reason{" "}
              {isSuspending ? (
                <span className="text-destructive">*</span>
              ) : (
                "(optional)"
              )}
            </label>
            <Textarea
              placeholder={
                isSuspending
                  ? "Provide a reason for suspension..."
                  : "Add a comment..."
              }
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError(false);
              }}
              className={reasonError ? "border-destructive" : ""}
            />
            {reasonError && (
              <p className="text-destructive text-xs">
                A reason is required when suspending.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isSuspending ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending
              ? "Submitting..."
              : isSuspending
                ? "Suspend"
                : "Activate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
