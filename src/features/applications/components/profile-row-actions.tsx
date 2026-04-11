import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EyeIcon, MoreHorizontal } from "lucide-react";
import {
  IconBrandWhatsapp,
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
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import {
  sendVerificationLink,
  updateProfileStatus,
} from "#/lib/api/profiles-controller";
import { useRole } from "#/hooks/use-role";

type ProfileRowActionsProps = Readonly<{
  profile: AdminProfileListItem;
}>;

export function ProfileRowActions({ profile }: ProfileRowActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();

  const [verifLinkOpen, setVerifLinkOpen] = useState(false);
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
    onError: (error) => toast.error(error.message),
  });

  const activateMutation = useMutation({
    mutationFn: () => updateProfileStatus(profile.id, { status: "ACTIVE" }),
    onSuccess: () => {
      setActivateOpen(false);
      toast.success("Profile activated.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const suspendMutation = useMutation({
    mutationFn: () => updateProfileStatus(profile.id, { status: "SUSPENDED" }),
    onSuccess: () => {
      setSuspendOpen(false);
      toast.success("Profile suspended.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const canSendVerifLink = !profile.whatsappConnected;

  const canActivate =
    profile.status !== "ACTIVE" && profile.status !== "BANNED";
  const canDeactivate = profile.status === "ACTIVE";

  const isWhatsappConnected = profile.whatsappConnected;

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
              })
            }
          >
            <EyeIcon className="size-4" />
            View
          </DropdownMenuItem>

          {canManageContent && (
            <>
              <DropdownMenuItem
                disabled={isWhatsappConnected}
                onClick={() => canSendVerifLink && setVerifLinkOpen(true)}
              >
                <IconBrandWhatsapp className="size-4" />
                Send verification link
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
                onClick={() => canDeactivate && setSuspendOpen(true)}
              >
                <IconPlayerPause className="size-4" />
                Suspend
              </DropdownMenuItem>
            </>
          )}
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
