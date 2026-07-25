import { AdminBaseController } from "./base-controller";

export type ChatConversationType = "DIRECT" | "GROUP";

export type ChatAttachment = {
  url: string;
  key: string;
  name: string;
  mime: string;
  size: number;
};

export type ChatMessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string | null;
  attachments: ChatAttachment[];
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

export type ChatParticipantItem = {
  userId: string;
  name: string;
  role: string;
  lastReadAt: string | null;
};

export type ChatConversationItem = {
  id: string;
  type: ChatConversationType;
  name: string | null;
  isTeam: boolean;
  updatedAt: string;
  participants: ChatParticipantItem[];
  lastMessage: ChatMessageItem | null;
  unreadCount: number;
};

export type ChatTeamUser = { id: string; name: string; role: string };

export type ChatMessagesPage = {
  messages: ChatMessageItem[];
  nextCursor: string | null;
};

export class AdminChatController extends AdminBaseController {
  async listUsers(): Promise<ChatTeamUser[]> {
    const url = this.createURL("/admin/chat/users", new URLSearchParams());
    return this.get<ChatTeamUser[]>(url);
  }

  async listConversations(): Promise<ChatConversationItem[]> {
    const url = this.createURL(
      "/admin/chat/conversations",
      new URLSearchParams(),
    );
    return this.get<ChatConversationItem[]>(url);
  }

  async createDirect(userId: string): Promise<ChatConversationItem> {
    const url = this.createURL(
      "/admin/chat/conversations/direct",
      new URLSearchParams(),
    );
    return this.post<ChatConversationItem>(url, { userId });
  }

  async createGroup(
    name: string,
    memberIds: string[],
  ): Promise<ChatConversationItem> {
    const url = this.createURL(
      "/admin/chat/conversations/group",
      new URLSearchParams(),
    );
    return this.post<ChatConversationItem>(url, { name, memberIds });
  }

  async getMessages(
    conversationId: string,
    cursor?: string,
  ): Promise<ChatMessagesPage> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    const url = this.createURL(
      `/admin/chat/conversations/${conversationId}/messages`,
      params,
    );
    return this.get<ChatMessagesPage>(url);
  }

  async sendMessage(
    conversationId: string,
    input: { body?: string; attachments?: ChatAttachment[] },
  ): Promise<ChatMessageItem> {
    const url = this.createURL(
      `/admin/chat/conversations/${conversationId}/messages`,
      new URLSearchParams(),
    );
    return this.post<ChatMessageItem>(url, input);
  }

  async markRead(conversationId: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/chat/conversations/${conversationId}/read`,
      new URLSearchParams(),
    );
    return this.post<{ success: boolean }>(url, {});
  }

  async editMessage(
    messageId: string,
    body: string,
  ): Promise<ChatMessageItem> {
    const url = this.createURL(
      `/admin/chat/messages/${messageId}`,
      new URLSearchParams(),
    );
    return this.patch<ChatMessageItem>(url, { body });
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/chat/messages/${messageId}`,
      new URLSearchParams(),
    );
    return this.delete<{ success: boolean }>(url);
  }

  async uploadAttachment(file: File): Promise<ChatAttachment> {
    const url = this.createURL(
      "/admin/chat/attachments",
      new URLSearchParams(),
    );
    const form = new FormData();
    form.append("file", file);
    return this.post<ChatAttachment>(url, form);
  }
}

const controller = new AdminChatController();
export const listChatUsers = controller.listUsers.bind(controller);
export const listConversations = controller.listConversations.bind(controller);
export const createDirectConversation =
  controller.createDirect.bind(controller);
export const createGroupConversation = controller.createGroup.bind(controller);
export const getChatMessages = controller.getMessages.bind(controller);
export const sendChatMessage = controller.sendMessage.bind(controller);
export const markConversationRead = controller.markRead.bind(controller);
export const editChatMessage = controller.editMessage.bind(controller);
export const deleteChatMessage = controller.deleteMessage.bind(controller);
export const uploadChatAttachment =
  controller.uploadAttachment.bind(controller);
