import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import {
  IconSend,
  IconBrandWhatsapp,
  IconCreditCard,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";
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
import { PaymentVerificationModal } from "#/pages/profile-detail/components/payment-verification-modal";
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import {
  sendVerificationLink,
  updateProfileStatus,
  confirmPayment,
} from "#/lib/api/profiles-controller";
import { createPaymentLink } from "#/lib/api/payment-requests-controller";

type ProfileRowActionsProps = Readonly<{
  profile: AdminProfileListItem;
}>;

export function ProfileRowActions({ profile }: ProfileRowActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [verifLinkOpen, setVerifLinkOpen] = useState(false);
  const [paymentLinkOpen, setPaymentLinkOpen] = useState(false);
  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });

  const verifLinkMutation = useMutation({
    mutationFn: () => sendVerificationLink(profile.id),
    onSuccess: () => {
      setVerifLinkOpen(false);
      toast.success("Verification link sent via WhatsApp.");
      invalidate();
    },
    onError: () => toast.error("Failed to send verification link."),
  });

  const paymentLinkMutation = useMutation({
    mutationFn: () => createPaymentLink(profile.id),
    onSuccess: () => {
      setPaymentLinkOpen(false);
      toast.success("Payment link sent via WhatsApp.");
    },
    onError: () => toast.error("Failed to send payment link."),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (data: {
      decision: "ACCEPTED" | "REJECTED";
      reason?: string;
    }) => confirmPayment(profile.id, data.decision, data.reason),
    onSuccess: (_, variables) => {
      setConfirmPaymentOpen(false);
      if (variables.decision === "ACCEPTED") {
        toast.success("Payment confirmed. Profile is now active.");
      } else {
        toast.success("Payment rejected.");
      }
      invalidate();
    },
    onError: () => toast.error("Failed to process payment decision."),
  });

  const activateMutation = useMutation({
    mutationFn: () => updateProfileStatus(profile.id, { status: "ACTIVE" }),
    onSuccess: () => {
      setActivateOpen(false);
      toast.success("Profile activated.");
      invalidate();
    },
    onError: () => toast.error("Failed to activate profile."),
  });

  const suspendMutation = useMutation({
    mutationFn: () => updateProfileStatus(profile.id, { status: "SUSPENDED" }),
    onSuccess: () => {
      setSuspendOpen(false);
      toast.success("Profile suspended.");
      invalidate();
    },
    onError: () => toast.error("Failed to suspend profile."),
  });

  const canSendVerifLink = !profile.whatsappConnected;
  const canSendPaymentLink = profile.status === "PENDING_PAYMENT";
  const canConfirmPayment = profile.status === "PENDING_PAYMENT";
  const canActivate =
    profile.status !== "ACTIVE" &&
    profile.status !== "BANNED" &&
    profile.status !== "PENDING_PAYMENT";
  const canDeactivate = profile.status === "ACTIVE";
  const canVerifyKyc = profile.verificationStatus !== "VERIFIED";

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
                params: { profileId: profile.id },
                replace: true,
              })
            }
          >
            <EyeIcon className="size-4" />
            View
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canSendVerifLink}
            onClick={() => canSendVerifLink && setVerifLinkOpen(true)}
          >
            <IconBrandWhatsapp className="size-4" />
            Send verification link
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canSendPaymentLink}
            onClick={() => canSendPaymentLink && setPaymentLinkOpen(true)}
          >
            <IconSend className="size-4" />
            Send payment link
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canConfirmPayment}
            onClick={() => canConfirmPayment && setConfirmPaymentOpen(true)}
          >
            <IconCreditCard className="size-4" />
            Confirm payment
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canActivate}
            onClick={() => canActivate && setActivateOpen(true)}
          >
            <IconPlayerPlay className="size-4" />
            Activate
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canDeactivate}
            className={
              canDeactivate ? "text-destructive focus:text-destructive" : ""
            }
            onClick={() => canDeactivate && setSuspendOpen(true)}
          >
            <IconPlayerPause className="size-4" />
            Suspend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={verifLinkOpen}
        onOpenChange={setVerifLinkOpen}
        title="Send verification link"
        description="This will generate a new WhatsApp verification link and send it to the profile's phone number."
        actionLabel="Send via WhatsApp"
        onConfirm={() => verifLinkMutation.mutate()}
        isPending={verifLinkMutation.isPending}
        variant="default"
      />
      <ConfirmDialog
        open={paymentLinkOpen}
        onOpenChange={setPaymentLinkOpen}
        title="Send payment link"
        description="This will generate a payment link and send it to the profile via WhatsApp."
        actionLabel="Send via WhatsApp"
        onConfirm={() => paymentLinkMutation.mutate()}
        isPending={paymentLinkMutation.isPending}
        variant="default"
      />
      <PaymentVerificationModal
        open={confirmPaymentOpen}
        onOpenChange={setConfirmPaymentOpen}
        onSubmit={(decision, reason) =>
          confirmPaymentMutation.mutate({ decision, reason })
        }
        isPending={confirmPaymentMutation.isPending}
      />
      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate profile"
        description="This will set the profile status to Active."
        actionLabel="Activate"
        onConfirm={() => activateMutation.mutate()}
        isPending={activateMutation.isPending}
        variant="default"
      />
      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend profile"
        description="This will suspend the profile. The user will no longer be able to use the platform."
        actionLabel="Suspend"
        onConfirm={() => suspendMutation.mutate()}
        isPending={suspendMutation.isPending}
        variant="destructive"
      />
    </>
  );
}
