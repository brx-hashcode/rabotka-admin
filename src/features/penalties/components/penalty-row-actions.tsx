import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import { IconCreditCard, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";
import type { AdminPenaltyListItem } from "#/lib/api/penalties-controller";
import {
  confirmPenaltyPayment,
  deletePenalty,
} from "#/lib/api/penalties-controller";
import { useRole } from "#/hooks/use-role";

type PenaltyRowActionsProps = Readonly<{
  penalty: AdminPenaltyListItem;
}>;

export function PenaltyRowActions({ penalty }: PenaltyRowActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();

  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "penalties"] });

  const confirmPaymentMutation = useMutation({
    mutationFn: () => confirmPenaltyPayment(penalty.id),
    onSuccess: () => {
      setConfirmPaymentOpen(false);
      toast.success("Payment confirmed — penalty marked as paid.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePenalty(penalty.id),
    onSuccess: () => {
      setDeleteOpen(false);
      toast.success("Penalty deleted.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const canConfirmPayment = penalty.paidAt == null;

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
                to: "/penalties/$penaltyId",
                params: { penaltyId: penalty.id },
              })
            }
          >
            <EyeIcon className="size-4" />
            View
          </DropdownMenuItem>

          {canManageContent && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                disabled={!canConfirmPayment}
                onClick={() => canConfirmPayment && setConfirmPaymentOpen(true)}
              >
                <IconCreditCard className="size-4" />
                Confirm payment
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <IconTrash className="size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmPaymentOpen}
        onOpenChange={setConfirmPaymentOpen}
        title="Confirm penalty payment"
        description="This will mark the penalty as paid and credit the system wallet. This action cannot be undone."
        actionLabel="Confirm payment"
        onConfirm={() => confirmPaymentMutation.mutate()}
        isPending={confirmPaymentMutation.isPending}
        variant="default"
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete penalty"
        description="This will permanently delete this penalty. The worker's billing status will be updated automatically."
        actionLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
        variant="destructive"
      />
    </>
  );
}
