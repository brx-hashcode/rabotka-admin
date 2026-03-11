import { useState, useEffect } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";

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
import { cn } from "#/lib/utils";

type PaymentVerificationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (decision: "ACCEPTED" | "REJECTED", reason?: string) => void;
  isPending: boolean;
};

export function PaymentVerificationModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: Readonly<PaymentVerificationModalProps>) {
  const [decision, setDecision] = useState<"ACCEPTED" | "REJECTED" | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  useEffect(() => {
    if (!open) {
      setDecision(null);
      setReason("");
      setReasonError(false);
    }
  }, [open]);

  const canSubmit =
    decision != null && (decision !== "REJECTED" || reason.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (decision === "REJECTED" && !reason.trim()) {
      setReasonError(true);
      return;
    }
    onSubmit(decision, reason.trim() || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Verification</DialogTitle>
          <DialogDescription>
            Review the payment and confirm whether it has been received or
            reject it with a reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={decision === "ACCEPTED" ? "default" : "outline"}
              className={
                decision === "ACCEPTED"
                  ? "h-auto flex-col gap-1.5 border-green-600 bg-green-600 py-2 text-white hover:bg-green-700"
                  : "h-auto flex-col gap-1.5 py-2"
              }
              onClick={() => {
                setDecision("ACCEPTED");
                setReasonError(false);
              }}
            >
              <IconCheck className="size-5" />
              <span>Accept</span>
            </Button>
            <Button
              type="button"
              variant={decision === "REJECTED" ? "destructive" : "outline"}
              className="h-auto flex-col gap-1.5 py-2"
              onClick={() => setDecision("REJECTED")}
            >
              <IconX className="size-5" />
              <span>Reject</span>
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Reason{" "}
              {decision === "REJECTED" ? (
                <span className="text-destructive">*</span>
              ) : (
                "(optional)"
              )}
            </label>
            <Textarea
              placeholder={
                decision === "REJECTED"
                  ? "Provide a reason for rejection..."
                  : "Add a comment..."
              }
              value={reason}
              rows={3}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError(false);
              }}
              className={cn("resize-none", reasonError && "border-destructive")}
            />
            {reasonError && (
              <p className="text-destructive text-xs">
                A reason is required when rejecting.
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
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            variant={decision === "REJECTED" ? "destructive" : "default"}
          >
            {isPending ? "Submitting..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
