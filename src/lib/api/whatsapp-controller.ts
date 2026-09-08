import { AdminBaseController } from "./base-controller";
import { appConfig } from "#/config";
import { fetchWithCsrfRetry } from "./csrf-token";

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
  /**
   * AED → XAF for the consumption card, or null when the rate could not be
   * established — or when Meta did not bill in AED at all, in which case the
   * card must not render rather than converting the wrong currency.
   *
   * Never a fallback rate. See the backend's currency-conversion.util.ts for
   * why only one leg of this conversion is actually fetched.
   */
  fx: WhatsappFxQuote | null;
};

export type WhatsappFxQuote = {
  base: "AED";
  target: "XAF";
  /** XAF per 1 AED. */
  rate: number;
  /** The floating leg, surfaced so a reader can check the figure by hand. */
  eurUsd: number;
  /** ECB reference date — not "now"; the ECB publishes once per working day. */
  asOf: string;
  source: string;
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

  /**
   * The consumption report, as a PDF for the current window.
   *
   * Raw `fetch` rather than the base controller, which parses every response as
   * JSON — same route every other blob download in the admin takes (see
   * `fetchInvoiceBlob`).
   *
   * The 503 body carries the reason Meta could not be read, which is the only
   * useful thing to put in front of the reader when no document comes back.
   */
  async getBillingReportPdf(
    params: WhatsappRangeParams,
  ): Promise<{ blob: Blob; filename: string }> {
    const query = this.buildSearchParams(rangeParams(params));
    const search = query.toString();
    const response = await fetchWithCsrfRetry(
      `${appConfig.apiUrl}/admin/whatsapp/billing/report.pdf${
        search ? `?${search}` : ""
      }`,
      { credentials: "include" },
    );
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : "The report could not be generated.";
      throw new Error(message);
    }
    return {
      blob: await response.blob(),
      // The server already named the file after the window it actually
      // rendered — which is not always the one asked for, since Meta's
      // one-year lookback can move the start. Re-deriving the name here would
      // reintroduce exactly that discrepancy.
      filename:
        parseAttachmentFilename(response.headers.get("content-disposition")) ??
        "whatsapp-consumption.pdf",
    };
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

/** Pulls `report.pdf` out of `attachment; filename="report.pdf"`. */
function parseAttachmentFilename(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1].trim() : null;
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
export const getWhatsappBillingReportPdf =
  controller.getBillingReportPdf.bind(controller);
export const getWhatsappQueue = controller.getQueue.bind(controller);
export const retryWhatsappDlqJob = controller.retryDlqJob.bind(controller);

/**
 * The list DTO caps `limit` at 100 server-side, so this is the ceiling rather
 * than a tuning choice — asking for more is a 400.
 */
const EXPORT_PAGE_SIZE = 100;

/** Fetch every message matching the given filters, paging through the list. */
export async function fetchAllWhatsappMessages(
  filters: Omit<WhatsappMessagesListParams, "page" | "limit">,
): Promise<WhatsappMessageItem[]> {
  const all: WhatsappMessageItem[] = [];
  let page = 1;
  for (;;) {
    const res = await getWhatsappMessages({
      ...filters,
      page,
      limit: EXPORT_PAGE_SIZE,
    });
    all.push(...res.data);
    if (all.length >= res.total || res.data.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }
  return all;
}
