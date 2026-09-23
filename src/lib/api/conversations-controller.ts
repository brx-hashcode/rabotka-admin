import { AdminBaseController } from "./base-controller";

/**
 * What a detection matched. Mirrors the backend enum exactly — note
 * MESSAGING_HANDLE, not SOCIAL_HANDLE: a wrong name here typechecks fine and
 * renders a blank badge.
 */
export type RedactionCategory =
  | "PHONE"
  | "EMAIL"
  | "MESSAGING_HANDLE"
  | "URL"
  | "OBFUSCATED_DIGITS";

/** CLEAN went through whole, REDACTED lost a fragment, HELD never arrived. */
export type MessageModerationStatus = "CLEAN" | "REDACTED" | "HELD";

export type ConversationParty = {
  id: string;
  name: string;
  /** Phone, not email: most profiles here have no email, and phone is identity. */
  phone: string;
  avatarUrl: string | null;
  lastReadAt: string | null;
  /**
   * This side cleared their own copy of the thread. Metadata, never a filter —
   * the rows are untouched and the other side still reads every one of them.
   */
  hiddenAt: string | null;
};

/**
 * A conversation as the list shows it.
 *
 * CARRIES NO MESSAGE TEXT, deliberately — the list is the MODERATOR surface and
 * reading bodies is a separate, logged act. If a preview field ever appears
 * here, the permission split has been broken server-side.
 */
export type AdminConversationListItem = {
  id: string;
  worker: ConversationParty;
  employer: ConversationParty;
  /** Null means cold outreach: nobody applied, one side simply wrote. */
  applicationId: string | null;
  jobOfferId: string | null;
  jobTitle: string | null;
  messageCount: number;
  redactedCount: number;
  heldCount: number;
  pendingReportCount: number;
  /** Null when every message was held: nothing was ever delivered. */
  lastMessageAt: string | null;
  closedAt: string | null;
  createdAt: string;
};

export type AdminConversationsResponse = {
  data: AdminConversationListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminConversationDetail = AdminConversationListItem & {
  cleanCount: number;
  semanticFlaggedCount: number;
  deletedCount: number;
  redactionsByCategory: Record<RedactionCategory, number>;
};

/**
 * One withheld fragment, as offsets into the RAW body.
 *
 * `matchedBy` is the rule that fired — surfaced in the UI on hover, because it
 * is what lets somebody notice "this pattern produces most of our false
 * positives" while reading rather than by running a query later.
 */
export type AdminRedaction = {
  start: number;
  end: number;
  category: RedactionCategory;
  matchedBy: string;
};

export type AdminMessage = {
  id: string;
  senderId: string;
  senderName: string;
  /** Which side wrote it. There is no "mine" here — the admin is neither. */
  senderSide: "WORKER" | "EMPLOYER";
  /** RAW, exactly as typed, including what the recipient never received. */
  body: string;
  status: MessageModerationStatus;
  semanticFlagged: boolean;
  redactions: AdminRedaction[];
  reports: {
    id: string;
    note: string | null;
    reviewedAt: string | null;
    upheld: boolean | null;
  }[];
  readAt: string | null;
  deletedAt: string | null;
  createdAt: string;
};

export type AdminThreadResponse = {
  data: AdminMessage[];
  total: number;
  page: number;
  limit: number;
  workerId: string;
  employerId: string;
};

export type AdminConversationsListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  flags?: string[];
  worker_id?: string;
  employer_id?: string;
  since?: string;
  until?: string;
};

export class AdminConversationsController extends AdminBaseController {
  async getList(
    params: AdminConversationsListParams,
  ): Promise<AdminConversationsResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.status?.length) searchParams.status = params.status;
    if (params.flags?.length) searchParams.flags = params.flags;
    if (params.worker_id) searchParams.worker_id = params.worker_id;
    if (params.employer_id) searchParams.employer_id = params.employer_id;
    if (params.since) searchParams.since = params.since;
    if (params.until) searchParams.until = params.until;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/conversations", query);
    return this.get<AdminConversationsResponse>(url);
  }

  async getById(id: string): Promise<AdminConversationDetail> {
    const url = this.createURL(
      `/admin/conversations/${id}`,
      new URLSearchParams(),
    );
    return this.get<AdminConversationDetail>(url);
  }

  /**
   * The messages. A DIFFERENT PREFIX, not a sub-path of the one above — the
   * server puts this on its own controller so lateral roles can be granted the
   * conversation list without the bodies. Keep the path in step with it.
   *
   * Every call writes an audit row server-side.
   */
  async getMessages(
    id: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<AdminThreadResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;

    const url = this.createURL(
      `/admin/conversations/thread/${id}/messages`,
      this.buildSearchParams(searchParams),
    );
    return this.get<AdminThreadResponse>(url);
  }

  /**
   * Lock the conversation: neither party may write in it again.
   *
   * Reaches the two people's own app within the minute — their thread header
   * polls, and the client already swaps the composer for a closed notice off
   * this flag. Nothing is deleted; both sides keep every message.
   */
  async close(id: string): Promise<AdminConversationDetail> {
    const url = this.createURL(
      `/admin/conversations/${id}/close`,
      new URLSearchParams(),
    );
    return this.post<AdminConversationDetail>(url);
  }

  async reopen(id: string): Promise<AdminConversationDetail> {
    const url = this.createURL(
      `/admin/conversations/${id}/reopen`,
      new URLSearchParams(),
    );
    return this.post<AdminConversationDetail>(url);
  }
}

const controller = new AdminConversationsController();
export const getConversationsList = controller.getList.bind(controller);
export const getConversationById = controller.getById.bind(controller);
export const getConversationMessages = controller.getMessages.bind(controller);
export const closeConversation = controller.close.bind(controller);
export const reopenConversation = controller.reopen.bind(controller);
