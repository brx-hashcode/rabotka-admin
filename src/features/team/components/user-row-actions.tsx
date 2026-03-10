import { useState } from "react";
import {
  IconDots,
  IconEdit,
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react";

import { type AdminUserListItem } from "#/lib/api/users-controller";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { ConfirmDialog } from "./confirm-dialog";
import { UserModal } from "./user-modal";
import { useToggleUserStatus } from "../hooks/use-toggle-user-status";

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
    description:
      "This will allow the user to access the admin panel again.",
    variant: "default" as const,
  },
} as const;

type Props = {
  user: AdminUserListItem;
};

export function UserRowActions({ user }: Readonly<Props>) {
  const [editOpen, setEditOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    keyof typeof STATUS_ACTIONS | null
  >(null);

  const toggleStatus = useToggleUserStatus(user.id, user.isActive);
  const confirmAction = pendingAction ? STATUS_ACTIONS[pendingAction] : null;

  const handleConfirm = () => {
    toggleStatus.mutate(undefined, {
      onSuccess: () => setPendingAction(null),
    });
  };

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
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <IconEdit className="mr-2 size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!user.isActive || toggleStatus.isPending}
            onClick={() => setPendingAction("active")}
          >
            <IconUserOff className="mr-2 size-4" />
            Deactivate
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={user.isActive || toggleStatus.isPending}
            onClick={() => setPendingAction("inactive")}
          >
            <IconUserCheck className="mr-2 size-4" />
            Activate
          </DropdownMenuItem>
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
        onConfirm={handleConfirm}
        isPending={toggleStatus.isPending}
        variant={confirmAction?.variant}
      />

      <UserModal open={editOpen} onOpenChange={setEditOpen} user={user} />
    </>
  );
}
