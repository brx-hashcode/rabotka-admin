import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import {
  listNotifications,
  markAllNotificationsRead,
  clearAllNotifications,
} from "#/lib/api/notification-controller";

type AdminNotificationPayload = {
  event: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

type SocketState = {
  socket: Socket | null;
  isConnected: boolean;
  notifications: AdminNotificationPayload[];
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
  clearNotifications: () => void;
  markAllRead: () => void;
  loadFromServer: () => Promise<void>;
};

export type { AdminNotificationPayload };

const notificationSound = new Audio("/notification.wav");
notificationSound.volume = 0.5;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,

  connect: () => {
    if (get().socket) return;

    const socket = io("/admin-notifications", {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      set({ isConnected: true });
      get().loadFromServer();
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("notification", (payload: AdminNotificationPayload) => {
      notificationSound.currentTime = 0;
      notificationSound.play().catch(() => {});
      set((state) => ({
        notifications: [payload, ...state.notifications].slice(0, 50),
        unreadCount: state.unreadCount + 1,
      }));
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  loadFromServer: async () => {
    try {
      const { notifications, unreadCount } = await listNotifications();
      set({
        notifications: notifications.map((n) => ({
          event: n.event,
          title: n.title,
          message: n.message,
          entityType: n.entity_type,
          entityId: n.entity_id,
          metadata: n.metadata,
          timestamp: n.created_at,
        })),
        unreadCount,
      });
    } catch {
      // silently fail — notifications will still work in real-time
    }
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
    clearAllNotifications().catch(() => {});
  },

  markAllRead: () => {
    set({ unreadCount: 0 });
    markAllNotificationsRead().catch(() => {});
  },
}));
