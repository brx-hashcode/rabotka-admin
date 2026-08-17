import { AdminBaseController } from "./base-controller";

/**
 * The WhatsApp delivery log and its analytics.
 *
 * Nothing here existed before: sends were fire-and-forget and delivery
 * webhooks were discarded, so the admin had no way to tell a delivered
 * message from one that silently failed.
 */

export type WhatsappDeliveryStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED";

export type WhatsappMessageItem = {
  id: string;
  createdAt: string;
  provider: string;
  providerMessageId: string | null;
  direction: "INBOUND" | "OUTBOUND";
  toPhone: string;
  profileId: string | null;
  profileName: string | null;
  kind: string;
  templateKey: string | null;
  templateCategory: string | null;
  bodyPreview: string;
  variables: Record<string, unknown> | null;
  status: WhatsappDeliveryStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  errorCode: string | null;
  errorProviderCode: number | null;
  errorMessage: string | null;
  pricingCategory: string | null;
  billable: boolean | null;
  sentByName: string | null;
};

export type WhatsappMessagesListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  template_key?: string[];
  kind?: string[];
  direction?: string[];
  provider?: string[];
  profile_id?: string;
  created_from?: string;
  created_to?: string;
};

export type WhatsappMessagesResponse = {
  data: WhatsappMessageItem[];
  total: number;
  page: number;
  limit: number;
};

export type WhatsappStats = {
  totals: Record<WhatsappDeliveryStatus, number>;
  total: number;
  sent: number;
  deliveryRate: number;
  readRate: number;
  failureRate: number;
  medianDeliverySeconds: number | null;
  timeline: {
    date: string;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }[];
  byTemplate: {
    templateKey: string;
    category: string | null;
    total: number;
    delivered: number;
    failed: number;
  }[];
  byError: { errorCode: string; count: number; sample: string | null }[];
};

export type WhatsappBilling = {
  provider: string;
  currency: string | null;
  pricing: {
    start: number;
    end: number;
    volume: number;
    /**
     * Absent — not zero — when Meta withholds cost, which it does for
     * partner-billed accounts. The UI must not render the two the same way.
     */
    cost?: number;
    pricing_category?: string;
    pricing_type?: string;
    country?: string;
  }[];
  messaging: { start: number; end: number; sent: number; delivered: number }[];
  costUnavailableReason: string | null;
  /**
   * Why the lookup failed, when it did. Null on success.
   *
   * Graph being briefly unreachable arrives as data rather than as a 500, so
   * the rest of the page — delivery statistics, which come from our own
   * database — keeps rendering through a blip at Meta.
   */
  unavailable: string | null;
  /**
   * What has been CHARGED, as opposed to what was consumed above. Separate on
   * purpose — a usage total is not an amount owed, and reading one as the
   * other overstates the bill by everything already paid.
   */
  billing: WhatsappBusinessBilling;
};

export type WhatsappBusinessBilling = {
  businessId: string | null;
  /**
   * The OAuth scope the token is missing, or null when everything was
   * readable. These edges exist and are reachable — a WhatsApp-only system
   * user simply does not carry `business_management` by default.
   */
  permissionMissing: string | null;
  creditLines: {
    id: string;
    legalEntityName: string | null;
    balance: string | null;
    maxBalance: string | null;
    creditAvailable: string | null;
    currency: string | null;
  }[];
  invoices: {
    id: string;
    billingPeriod: string | null;
    amountDue: string | null;
    currency: string | null;
    dueDate: string | null;
    paymentStatus: string | null;
    invoiceDate: string | null;
    downloadUri: string | null;
  }[];
  cards: {
    id: string;
    displayString: string | null;
    expiryMonth: string | null;
    expiryYear: string | null;
    isDefault: boolean;
  }[];
};

export type WhatsappQueueSnapshot = {
  outbound: Record<string, number>;
  dlq: Record<string, number>;
  dlqJobs: {
    id: string;
    originalJobId: string | null;
    error: string | null;
    failedAt: string | null;
    phone: string | null;
    type: string | null;
  }[];
};

export type WhatsappRangeParams = {
  created_from?: string;
  created_to?: string;
};

export class AdminWhatsappController extends AdminBaseController {
  async getMessages(
    params: WhatsappMessagesListParams,
  ): Promise<WhatsappMessagesResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.status?.length) searchParams.status = params.status;
    if (params.template_key?.length) {
      searchParams.template_key = params.template_key;
    }
    if (params.kind?.length) searchParams.kind = params.kind;
    if (params.direction?.length) searchParams.direction = params.direction;
    if (params.provider?.length) searchParams.provider = params.provider;
    if (params.profile_id) searchParams.profile_id = params.profile_id;
    if (params.created_from) searchParams.created_from = params.created_from;
    if (params.created_to) searchParams.created_to = params.created_to;

    const query = this.buildSearchParams(searchParams);
    return this.get<WhatsappMessagesResponse>(
      this.createURL("/admin/whatsapp/messages", query),
    );
  }

  async getStats(params: WhatsappRangeParams): Promise<WhatsappStats> {
    const query = this.buildSearchParams(rangeParams(params));
    return this.get<WhatsappStats>(
      this.createURL("/admin/whatsapp/stats", query),
    );
  }

  async getBilling(params: WhatsappRangeParams): Promise<WhatsappBilling> {
    const query = this.buildSearchParams(rangeParams(params));
    return this.get<WhatsappBilling>(
      this.createURL("/admin/whatsapp/billing", query),
    );
  }

  async getQueue(): Promise<WhatsappQueueSnapshot> {
    // No query string, so no `createURL` — it requires search params.
    return this.get<WhatsappQueueSnapshot>("/admin/whatsapp/queue");
  }

  async retryDlqJob(jobId: string): Promise<{ retried: boolean }> {
    return this.post<{ retried: boolean }>(
      `/admin/whatsapp/queue/dlq/${encodeURIComponent(jobId)}/retry`,
    );
  }
}

function rangeParams(params: WhatsappRangeParams): Record<string, unknown> {
  const searchParams: Record<string, unknown> = {};
  if (params.created_from) searchParams.created_from = params.created_from;
  if (params.created_to) searchParams.created_to = params.created_to;
  return searchParams;
}

const controller = new AdminWhatsappController();
export const getWhatsappMessages = controller.getMessages.bind(controller);
export const getWhatsappStats = controller.getStats.bind(controller);
export const getWhatsappBilling = controller.getBilling.bind(controller);
export const getWhatsappQueue = controller.getQueue.bind(controller);
export const retryWhatsappDlqJob = controller.retryDlqJob.bind(controller);
