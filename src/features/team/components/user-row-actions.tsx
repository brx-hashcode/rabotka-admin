import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconDots, IconEdit, IconUserCheck, IconUserOff } from "@tabler/icons-react";

import {
  activateAdminUser,
  deactivateAdminUser,
  type AdminUserListItem,
} from "#/lib/api/users-controller";

import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { UserModal } from "./user-modal";

type Props = {
  user: AdminUserListItem;
};

export function UserRowActions({ user }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const activateMutation = useMutation({
    mutationFn: () => activateAdminUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateAdminUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const handleDeactivateClick = () => {
    if (globalThis.confirm("Are you sure you want to deactivate this user?")) {
      deactivateMutation.mutate();
    }
  };

  const handleActivateClick = () => {
    if (globalThis.confirm("Are you sure you want to activate this user?")) {
      activateMutation.mutate();
    }
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
          {user.isActive ? (
            <DropdownMenuItem
              onClick={handleDeactivateClick}
              disabled={deactivateMutation.isPending}
            >
              <IconUserOff className="mr-2 size-4" />
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={handleActivateClick}
              disabled={activateMutation.isPending}
            >
              <IconUserCheck className="mr-2 size-4" />
              Activate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserModal open={editOpen} onOpenChange={setEditOpen} user={user} />
    </>
  );
}
