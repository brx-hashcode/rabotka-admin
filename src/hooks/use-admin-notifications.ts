import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useSocketStore,
  type AdminNotificationPayload,
} from "#/stores/use-socket-store";

const ENTITY_QUERY_KEYS: Record<string, string[][]> = {
  profile: [["admin", "profiles"]],
  "job-offer": [
    ["admin", "jobs"],
    ["admin", "job-offers"],
  ],
  application: [["admin", "applications"]],
  claim: [["admin", "claims"]],
  event: [["admin", "events"]],
  payment: [["admin", "payments"]],
  penalty: [["admin", "penalties"]],
};

export function useAdminNotifications() {
  const queryClient = useQueryClient();
  const { socket, connect } = useSocketStore();

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: AdminNotificationPayload) => {
      toast(payload.title, { description: payload.message });

      const keys = ENTITY_QUERY_KEYS[payload.entityType] ?? [];
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    };

    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, queryClient]);
}
