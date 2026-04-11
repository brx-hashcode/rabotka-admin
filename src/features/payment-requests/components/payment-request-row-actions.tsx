import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import { IconCreditCard } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Button } from "#/components/ui/button";
import { PaymentVerificationModal } from "#/pages/profile-detail/components/payment-verification-modal";
import {
  approvePaymentRequest,
  rejectPaymentRequest,
  type AdminPaymentRequestListItem,
} from "#/lib/api/payment-requests-controller";
import { useRole } from "#/hooks/use-role";

type PaymentRequestRowActionsProps = Readonly<{
  request: AdminPaymentRequestListItem;
}>;

export function PaymentRequestRowActions({
  request,
}: PaymentRequestRowActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const [modalOpen, setModalOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "payment-requests"] });

  const approveMutation = useMutation({
    mutationFn: () => approvePaymentRequest(request.id),
    onSuccess: () => {
      invalidate();
      toast.success("Payment request approved.");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to approve payment request."),
  });

  const rejectMutation = useMutation({
    mutationFn: (note: string) => rejectPaymentRequest(request.id, note),
    onSuccess: () => {
      invalidate();
      toast.success("Payment request rejected.");
      setModalOpen(false);
    },
    onError: () => toast.error("Failed to reject payment request."),
  });

  const canProcess = request.status === "SUBMITTED";
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  const handleDecision = (
    decision: "ACCEPTED" | "REJECTED",
    reason?: string,
  ) => {
    if (decision === "ACCEPTED") {
      approveMutation.mutate();
    } else {
      rejectMutation.mutate(reason ?? "");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={() =>
              navigate({
                to: "/profiles/$profileId",
                params: { profileId: request.profileId },
                search: { tab: "payments" },
              })
            }
          >
            <EyeIcon className="size-4" />
            View profile
          </DropdownMenuItem>
          {canManageContent && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canProcess}
                onClick={() => canProcess && setModalOpen(true)}
              >
                <IconCreditCard className="size-4" />
                Process payment
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <PaymentVerificationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleDecision}
        isPending={isPending}
      />
    </>
  );
}
