import { useState, useEffect } from "react";

import { Button } from "#/components/ui/button";
import { ReasonField } from "#/components/reason-field";
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
          <ReasonField
            value={reason}
            onChange={(value) => {
              setReason(value);
              if (value.trim()) setReasonError(false);
            }}
            templateScope={isSuspending ? "ACCOUNT_SUSPEND" : "ACCOUNT_ACTIVATE"}
            placeholder={
              isSuspending
                ? "Provide a reason for suspension..."
                : "Add a comment..."
            }
            required={isSuspending}
            error={reasonError}
            errorMessage="A reason is required when suspending."
            disabled={isPending}
          />
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
