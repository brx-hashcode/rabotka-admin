import { EyeIcon, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Button } from "#/components/ui/button";
import type { AdminNotificationItem } from "#/lib/api/notification-controller";

type Props = {
  notification: AdminNotificationItem;
  canOpen: boolean;
  onOpen: (notification: AdminNotificationItem) => void;
  onDelete: (notification: AdminNotificationItem) => void;
};

export function NotificationRowActions({
  notification,
  canOpen,
  onOpen,
  onDelete,
}: Readonly<Props>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          disabled={!canOpen}
          onSelect={() => onOpen(notification)}
        >
          <EyeIcon className="size-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(notification)}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
