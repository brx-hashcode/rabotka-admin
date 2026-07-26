import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addConversationMembers,
  createDirectConversation,
  createGroupConversation,
  deleteConversation,
  getChatMessages,
  listChatUsers,
  listConversations,
  markConversationRead,
  removeConversationMember,
  sendChatMessage,
  uploadChatAttachment,
  type ChatAttachment,
  type ChatConversationItem,
  type ChatMessagesPage,
} from "#/lib/api/chat-controller";

export const chatKeys = {
  conversations: ["admin", "chat", "conversations"] as const,
  users: ["admin", "chat", "users"] as const,
  messages: (id: string) => ["admin", "chat", "messages", id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: listConversations,
  });
}

export function useTeamUsers() {
  return useQuery({ queryKey: chatKeys.users, queryFn: listChatUsers });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: conversationId
      ? chatKeys.messages(conversationId)
      : ["admin", "chat", "messages", "none"],
    queryFn: () => getChatMessages(conversationId as string),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  // Insert the sent message as soon as the POST resolves so the sender sees it
  // instantly instead of waiting for the socket `message:new` echo. The echo
  // then dedupes by id, so there's no double.
  return useMutation({
    mutationFn: (input: { body?: string; attachments?: ChatAttachment[] }) =>
      sendChatMessage(conversationId, input),
    onSuccess: (message) => {
      qc.setQueryData<ChatMessagesPage>(
        chatKeys.messages(conversationId),
        (prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === message.id)) return prev;
          return { ...prev, messages: [...prev.messages, message] };
        },
      );
      qc.setQueryData<ChatConversationItem[]>(
        chatKeys.conversations,
        (prev) => {
          if (!prev) return prev;
          const next = prev.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: message, updatedAt: message.createdAt }
              : c,
          );
          next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          return next;
        },
      );
    },
  });
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: (file: File) => uploadChatAttachment(file),
  });
}

export function useCreateDirect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => createDirectConversation(userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; memberIds: string[] }) =>
      createGroupConversation(input.name, input.memberIds),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

export function useAddMembers(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberIds: string[]) =>
      addConversationMembers(conversationId, memberIds),
    onSuccess: (updated) => {
      qc.setQueryData<ChatConversationItem[]>(
        chatKeys.conversations,
        (prev) =>
          prev?.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
  });
}

export function useRemoveMember(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      removeConversationMember(conversationId, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chatKeys.conversations }),
  });
}

export function useDeleteGroup(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteConversation(conversationId),
    onSuccess: () => {
      qc.setQueryData<ChatConversationItem[]>(
        chatKeys.conversations,
        (prev) => prev?.filter((c) => c.id !== conversationId),
      );
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      markConversationRead(conversationId),
    onMutate: async (conversationId) => {
      // Optimistically zero the unread badge for a snappy UI.
      qc.setQueryData<ChatConversationItem[]>(
        chatKeys.conversations,
        (prev) =>
          prev?.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c,
          ),
      );
    },
  });
}

/** Append older messages (cursor pagination) to the cached page. */
export function useLoadOlderMessages(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cursor: string) => getChatMessages(conversationId, cursor),
    onSuccess: (older) => {
      qc.setQueryData<ChatMessagesPage>(
        chatKeys.messages(conversationId),
        (prev) =>
          prev
            ? {
                messages: [...older.messages, ...prev.messages],
                nextCursor: older.nextCursor,
              }
            : older,
      );
    },
  });
}
