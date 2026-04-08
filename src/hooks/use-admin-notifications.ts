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

function requestNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

function sendBrowserNotification(payload: AdminNotificationPayload) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (localStorage.getItem("browserNotificationsEnabled") === "false") return;
  try {
    new Notification(payload.title, {
      body: payload.message,
      icon: "/favicon.ico",
      tag: `${payload.entityType}-${payload.entityId}`,
    });
  } catch {
    // Notification API not supported or blocked
  }
}

export function useAdminNotifications() {
  const queryClient = useQueryClient();
  const { socket, connect } = useSocketStore();

  useEffect(() => {
    connect();
    requestNotificationPermission();
  }, [connect]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: AdminNotificationPayload) => {
      toast(payload.title, { description: payload.message });
      sendBrowserNotification(payload);

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
