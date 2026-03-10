import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Button } from "#/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import {
  approvePaymentRequest,
  rejectPaymentRequest,
  type AdminPaymentRequestListItem,
} from "#/lib/api/payment-requests-controller";
import { RejectDialog } from "./reject-dialog";

type PaymentRequestRowActionsProps = Readonly<{
  request: AdminPaymentRequestListItem;
}>;

export function PaymentRequestRowActions({
  request,
}: PaymentRequestRowActionsProps) {
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => approvePaymentRequest(request.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-requests"] });
      toast.success("Payment request approved.");
      setApproveOpen(false);
    },
    onError: () => toast.error("Failed to approve payment request."),
  });

  const rejectMutation = useMutation({
    mutationFn: (note: string) => rejectPaymentRequest(request.id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-requests"] });
      toast.success("Payment request rejected.");
      setRejectOpen(false);
    },
    onError: () => toast.error("Failed to reject payment request."),
  });

  const canProcess = request.status === "SUBMITTED";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!canProcess}
            onClick={() => setApproveOpen(true)}
          >
            <IconCheck className="mr-2 size-4 text-green-600" />
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canProcess}
            onClick={() => setRejectOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <IconX className="mr-2 size-4" />
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve payment"
        description="This will mark the payment as approved and activate the user's account."
        actionLabel="Approve"
        onConfirm={() => approveMutation.mutate()}
        isPending={approveMutation.isPending}
        variant="default"
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        isPending={rejectMutation.isPending}
        onConfirm={(note) => rejectMutation.mutate(note)}
      />
    </>
  );
}
