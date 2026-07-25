import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAdminMe } from "#/hooks/use-admin-me";
import { useChatStore } from "#/stores/use-chat-store";
import { chatKeys } from "#/hooks/use-chat";
import type {
  ChatConversationItem,
  ChatMessageItem,
  ChatMessagesPage,
} from "#/lib/api/chat-controller";

type ChatNotification = {
  conversationId: string;
  conversationName: string | null;
  messageId: string;
  senderId: string;
  senderName: string;
  preview: string;
  createdAt: string;
};

const notificationSound = new Audio("/notification.wav");
notificationSound.volume = 0.5;

/**
 * App-wide chat socket: connects once (mount at the authenticated layout),
 * wires realtime events into react-query caches + the chat store, and raises
 * recipient notifications (toast/sound) for messages in non-active conversations.
 */
export function useChatSocket() {
  const queryClient = useQueryClient();
  const { data: me } = useAdminMe();
  const meId = me?.id;

  const setSocket = useChatStore((s) => s.setSocket);
  const setConnected = useChatStore((s) => s.setConnected);
  const setPresence = useChatStore((s) => s.setPresence);
  const setTyping = useChatStore((s) => s.setTyping);

  // Refs so socket handlers always see the latest without re-subscribing.
  const meIdRef = useRef<string | undefined>(meId);
  meIdRef.current = meId;

  useEffect(() => {
    if (!meId) return;

    const socket = io("/chat", {
      withCredentials: true,
      transports: ["websocket"],
    });
    setSocket(socket);

    const activeId = () => useChatStore.getState().activeConversationId;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("message:new", (message: ChatMessageItem) => {
      const isMine = message.senderId === meIdRef.current;
      const isActive = activeId() === message.conversationId;

      // Append to the open thread (dedupe by id).
      queryClient.setQueryData<ChatMessagesPage>(
        chatKeys.messages(message.conversationId),
        (prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === message.id)) return prev;
          return { ...prev, messages: [...prev.messages, message] };
        },
      );

      // Update the conversation list: last message, ordering, unread.
      queryClient.setQueryData<ChatConversationItem[]>(
        chatKeys.conversations,
        (prev) => {
          if (!prev) return prev;
          const next = prev.map((c) =>
            c.id === message.conversationId
              ? {
                  ...c,
                  lastMessage: message,
                  updatedAt: message.createdAt,
                  unreadCount:
                    isMine || isActive ? c.unreadCount : c.unreadCount + 1,
                }
              : c,
          );
          next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          return next;
        },
      );

      // If I'm actively viewing this conversation, clear my unread server-side.
      if (isActive && !isMine) {
        socket.emit("read", { conversationId: message.conversationId });
      }
    });

    socket.on("message:edited", (message: ChatMessageItem) => {
      queryClient.setQueryData<ChatMessagesPage>(
        chatKeys.messages(message.conversationId),
        (prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((m) =>
                  m.id === message.id ? message : m,
                ),
              }
            : prev,
      );
    });

    socket.on(
      "message:deleted",
      ({
        conversationId,
        messageId,
      }: {
        conversationId: string;
        messageId: string;
      }) => {
        queryClient.setQueryData<ChatMessagesPage>(
          chatKeys.messages(conversationId),
          (prev) =>
            prev
              ? {
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === messageId
                      ? { ...m, body: null, attachments: [], deletedAt: new Date().toISOString() }
                      : m,
                  ),
                }
              : prev,
        );
      },
    );

    socket.on(
      "typing",
      (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (data.userId === meIdRef.current) return;
        setTyping(data.conversationId, data.userId, data.isTyping);
      },
    );

    socket.on(
      "read",
      (data: { conversationId: string; userId: string; readAt: string }) => {
        queryClient.setQueryData<ChatConversationItem[]>(
          chatKeys.conversations,
          (prev) =>
            prev?.map((c) =>
              c.id === data.conversationId
                ? {
                    ...c,
                    participants: c.participants.map((p) =>
                      p.userId === data.userId
                        ? { ...p, lastReadAt: data.readAt }
                        : p,
                    ),
                  }
                : c,
            ),
        );
      },
    );

    socket.on("presence", (data: { userId: string; online: boolean }) => {
      setPresence(data.userId, data.online);
    });

    socket.on("chat:notification", (n: ChatNotification) => {
      // message:new already updated the unread badge; here we only alert.
      if (activeId() === n.conversationId) return;
      if (n.senderId === meIdRef.current) return;
      void notificationSound.play().catch(() => undefined);
      toast(n.conversationName ? `${n.senderName} · ${n.conversationName}` : n.senderName, {
        description: n.preview,
      });
    });

    return () => {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [meId, queryClient, setSocket, setConnected, setPresence, setTyping]);
}
