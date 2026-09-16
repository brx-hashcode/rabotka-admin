import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react";

import {
  deleteAdminUser,
  type AdminUserListItem,
} from "#/lib/api/users-controller";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ConfirmDialog } from "./confirm-dialog";
import { UserModal } from "./user-modal";
import { useToggleUserStatus } from "../hooks/use-toggle-user-status";
import { useRole } from "#/hooks/use-role";
import { friendlyError } from "#/lib/api/friendly-error";

const STATUS_ACTIONS = {
  active: {
    label: "Deactivate",
    icon: IconUserOff,
    title: "Deactivate user",
    description:
      "This will prevent the user from accessing the admin panel. You can always re-activate them later.",
    variant: "destructive" as const,
  },
  inactive: {
    label: "Activate",
    icon: IconUserCheck,
    title: "Activate user",
    description: "This will allow the user to access the admin panel again.",
    variant: "default" as const,
  },
} as const;

const DELETE_ACTION = {
  label: "Delete",
  title: "Delete user",
  description:
    "This will permanently delete the user account. This action cannot be undone.",
  variant: "destructive" as const,
} as const;

type Props = {
  user: AdminUserListItem;
};

export function UserRowActions({ user }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const { canManageTeam, canDeleteTeam } = useRole();
  const [editOpen, setEditOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    keyof typeof STATUS_ACTIONS | null
  >(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggleStatus = useToggleUserStatus(user.id, user.isActive);
  const confirmAction = pendingAction ? STATUS_ACTIONS[pendingAction] : null;

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeleteOpen(false);
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't update this team member. Try again."));
    },
  });

  const handleStatusConfirm = () => {
    toggleStatus.mutate(undefined, {
      onSuccess: () => setPendingAction(null),
    });
  };

  if (!canManageTeam && !canDeleteTeam) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <IconDots className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canManageTeam && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <IconEdit className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canManageTeam && (
            <DropdownMenuItem
              disabled={!user.isActive || toggleStatus.isPending}
              onClick={() => setPendingAction("active")}
            >
              <IconUserOff className="mr-2 size-4" />
              Deactivate
            </DropdownMenuItem>
          )}
          {canManageTeam && (
            <DropdownMenuItem
              disabled={user.isActive || toggleStatus.isPending}
              onClick={() => setPendingAction("inactive")}
            >
              <IconUserCheck className="mr-2 size-4" />
              Activate
            </DropdownMenuItem>
          )}
          {canDeleteTeam && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <IconTrash className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        actionLabel={confirmAction?.label ?? ""}
        onConfirm={handleStatusConfirm}
        isPending={toggleStatus.isPending}
        variant={confirmAction?.variant}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={DELETE_ACTION.title}
        description={DELETE_ACTION.description}
        actionLabel={DELETE_ACTION.label}
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
        variant={DELETE_ACTION.variant}
      />

      <UserModal open={editOpen} onOpenChange={setEditOpen} user={user} />
    </>
  );
}
