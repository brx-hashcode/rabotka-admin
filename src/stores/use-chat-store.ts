import { create } from "zustand";
import type { Socket } from "socket.io-client";

type ChatStoreState = {
  socket: Socket | null;
  connected: boolean;
  /** Conversation currently open in the UI (suppresses its notifications). */
  activeConversationId: string | null;
  /** userIds currently online. */
  onlineUserIds: string[];
  /** conversationId -> userIds currently typing (excluding self). */
  typingByConversation: Record<string, string[]>;

  setSocket: (socket: Socket | null) => void;
  setConnected: (connected: boolean) => void;
  setActiveConversation: (id: string | null) => void;
  setPresence: (userId: string, online: boolean) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;

  emitTyping: (conversationId: string, isTyping: boolean) => void;
  emitRead: (conversationId: string) => void;
  reset: () => void;
};

export const useChatStore = create<ChatStoreState>((set, get) => ({
  socket: null,
  connected: false,
  activeConversationId: null,
  onlineUserIds: [],
  typingByConversation: {},

  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ connected }),
  setActiveConversation: (activeConversationId) => set({ activeConversationId }),

  setPresence: (userId, online) =>
    set((s) => {
      const has = s.onlineUserIds.includes(userId);
      if (online && !has) {
        return { onlineUserIds: [...s.onlineUserIds, userId] };
      }
      if (!online && has) {
        return {
          onlineUserIds: s.onlineUserIds.filter((id) => id !== userId),
        };
      }
      return {};
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((s) => {
      const current = s.typingByConversation[conversationId] ?? [];
      const next = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId);
      return {
        typingByConversation: {
          ...s.typingByConversation,
          [conversationId]: next,
        },
      };
    }),

  emitTyping: (conversationId, isTyping) => {
    get().socket?.emit("typing", { conversationId, isTyping });
  },
  emitRead: (conversationId) => {
    get().socket?.emit("read", { conversationId });
  },

  reset: () =>
    set({
      activeConversationId: null,
      onlineUserIds: [],
      typingByConversation: {},
    }),
}));
