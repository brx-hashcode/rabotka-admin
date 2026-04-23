import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageListHeader } from "#/components/page-list-header";
import { DataTable } from "#/components/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { makeNotificationColumns } from "#/features/notifications/components/notification-columns";
import {
  clearAllNotifications,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  type AdminNotificationItem,
} from "#/lib/api/notification-controller";
import { getNotificationHref } from "#/features/notifications/utils";
import { useSocketStore } from "#/stores/use-socket-store";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const loadFromServer = useSocketStore((state) => state.loadFromServer);
  const [deleteTarget, setDeleteTarget] = useState<AdminNotificationItem | null>(
    null,
  );
  const [clearOpen, setClearOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: listNotifications,
  });

  const refreshNotifications = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    await loadFromServer();
  };

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      toast.success("Notifications marked as read");
      await refreshNotifications();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: async () => {
      toast.success("Notifications cleared");
      setClearOpen(false);
      await refreshNotifications();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: async () => {
      toast.success("Notification deleted");
      setDeleteTarget(null);
      await refreshNotifications();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenNotification = (notification: AdminNotificationItem) => {
    const href = getNotificationHref(
      notification.entity_type,
      notification.entity_id,
    );
    if (!href) {
      toast.error("No target page is available for this notification");
      return;
    }
    navigate({ to: href });
  };

  const columns = useMemo(
    () => makeNotificationColumns(handleOpenNotification, setDeleteTarget),
    [navigate],
  );

  return (
    <>
      <div className="pt-6">
        <PageListHeader
          title="Notifications"
          description="Review recent admin notifications and manage them from one place."
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending || !data?.unreadCount}
              >
                Mark all as read
              </Button>
              <Button
                variant="destructive"
                onClick={() => setClearOpen(true)}
                disabled={clearAllMutation.isPending || !data?.notifications.length}
              >
                Clear all
              </Button>
            </>
          }
        />

        <DataTable
          data={data?.notifications ?? []}
          columns={columns}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          emptyMessage="No notifications found."
        />
      </div>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove only this notification from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove every notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => clearAllMutation.mutate()}
            >
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
