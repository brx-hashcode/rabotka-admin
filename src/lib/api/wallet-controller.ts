import { AdminBaseController } from "./base-controller";
import { appConfig } from "#/config";
import { fetchWithCsrfRetry } from "./csrf-token";

export type AdminWalletInfo = {
  totalRevenue: number;
  balance: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  revenueByType: {
    penalty: number;
    contactUnlock: number;
  };
};

export type AdminWalletTransactionItem = {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type AdminPaymentItem = {
  id: string;
  profileId: string;
  type: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: string;
  paidAt: string | null;
  description: string | null;
  profileName: string | null;
  profileEmail: string | null;
  createdAt: string;
};

export type MonthlyRevenuePoint = { month: string; revenue: number };

export type AmountCount = { amount: number; count: number };

export type MobileNetworkKey = "MTN" | "AIRTEL" | "ORANGE" | "OTHER";

export type AdminMobileMoneyBalanceResult = {
  /** Rabotka's own ledger: mobile money in, minus withdrawals. */
  balance: number;
  transactionCount: number;
  credits: AmountCount;
  withdrawals: AmountCount;
  /** Inflows per network, the same network named once across gateways. */
  networks: Array<{ key: MobileNetworkKey; label: string } & AmountCount>;
  /** Inflows per gateway, retired ones included. */
  gateways: Array<{ key: string } & AmountCount>;
  /** @deprecated Raw operator codes; use `networks`. */
  byOperator: Record<string, number>;
  /** @deprecated Use `gateways`. */
  byGateway: Record<string, number>;
};

/** One wallet on the live gateway account (e.g. pawaPay), as it reports it. */
export type GatewayBalance = {
  country: string;
  currency: string;
  balance: string;
  operator?: string;
};

export type GatewayCountry = { code: string; name: string };

export type PayoutStatus = "PENDING" | "COMPLETED" | "FAILED";

/** Money sent from the gateway account to a mobile-money number. */
export type AdminPayoutItem = {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  phone: string;
  operator: string;
  country: string;
  note: string | null;
  status: PayoutStatus;
  gateway: string;
  gatewayRef: string | null;
  gatewayTxId: string | null;
  failureReason: string | null;
  completedAt: string | null;
  requestedBy: string | null;
};

export type SendPayoutBody = {
  /** One per dialog: resubmitting it never sends twice. */
  clientRequestId: string;
  amount: number;
  confirmAmount: number;
  phone: string;
  operator: string;
  note?: string;
};

export type PaymentOperatorMetadata = {
  code: string;
  label: string;
  /** ISO 3166-1 alpha-3 country the network serves, when the gateway says. */
  country?: string;
};

export type PaymentGatewayMetadata = {
  key: string;
  label: string;
  requiresOperator: boolean;
  operators: PaymentOperatorMetadata[];
};

/**
 * `gateways` is every gateway the backend ships, not only the live one — a
 * transaction row keeps the gateway it was paid through, so the admin still
 * has to name gateways the deployment has since moved off.
 */
export type PaymentGatewaysResponse = {
  active: string;
  gateways: PaymentGatewayMetadata[];
};

export type AdminMobileMoneyTransactionItem = {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  referenceType: string | null;
  referenceId: string | null;
  gateway: string | null;
  operator: string | null;
  network: MobileNetworkKey | null;
  description: string | null;
  payerName: string | null;
  payerProfileId: string | null;
  payerProfileType: string | null;
  payerPhone: string | null;
  requestType: string | null;
  paymentRequestId: string | null;
  gatewayRef: string | null;
  gatewayTxId: string | null;
  invoiceId: string | null;
  status: string;
  createdAt: string;
};

export type AdminMobileMoneyTransactionsParams = {
  page?: number;
  limit?: number;
  gateway?: string;
  operator?: string;
  network?: MobileNetworkKey;
  /** Payer name or phone. */
  q?: string;
  type?: string;
  created_from?: string;
  created_to?: string;
};

export type AdminMobileMoneyTransactionsResponse = {
  data: AdminMobileMoneyTransactionItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminWalletTransactionsParams = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string[];
  created_from?: string;
  created_to?: string;
  deleted?: boolean;
};

export type AdminWalletTransactionsResponse = {
  data: AdminWalletTransactionItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminPaymentsListParams = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string[];
  status?: string[];
  /** MOBILE_MONEY | WALLET | CARD | OTHER — the Method column. */
  method?: string[];
  created_from?: string;
  created_to?: string;
};

export type AdminPaymentsListResponse = {
  data: AdminPaymentItem[];
  total: number;
  page: number;
  limit: number;
};

class AdminWalletController extends AdminBaseController {
  async getInfo(
    params: { created_from?: string; created_to?: string } = {},
  ): Promise<AdminWalletInfo> {
    const query = new URLSearchParams();
    if (params.created_from) query.set("created_from", params.created_from);
    if (params.created_to) query.set("created_to", params.created_to);
    const url = this.createURL("/admin/wallet/revenue", query);
    return this.get<AdminWalletInfo>(url);
  }

  async getTransactions(
    params: AdminWalletTransactionsParams,
  ): Promise<AdminWalletTransactionsResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.type?.length) searchParams.type = params.type;
    if (params.created_from) searchParams.created_from = params.created_from;
    if (params.created_to) searchParams.created_to = params.created_to;
    if (params.deleted) searchParams.deleted = "true";

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/wallet/transactions", query);
    return this.get<AdminWalletTransactionsResponse>(url);
  }

  async getPayments(
    params: AdminPaymentsListParams,
  ): Promise<AdminPaymentsListResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.type?.length) searchParams.type = params.type;
    if (params.status?.length) searchParams.status = params.status;
    if (params.method?.length) searchParams.method = params.method;
    if (params.created_from) searchParams.created_from = params.created_from;
    if (params.created_to) searchParams.created_to = params.created_to;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/wallet/payments", query);
    return this.get<AdminPaymentsListResponse>(url);
  }

  /** Jan–Dec revenue for the given calendar year (defaults to current year on the server if omitted). */
  async getMonthlyRevenue(year?: number): Promise<MonthlyRevenuePoint[]> {
    const query = this.buildSearchParams(
      year === undefined || year === null ? {} : { year },
    );
    const url = this.createURL("/admin/wallet/monthly-revenue", query);
    return this.get<MonthlyRevenuePoint[]>(url);
  }

  /** Rolling window of `months` months ending at the current month (for radar chart). */
  async getRollingMonthlyRevenue(months: number): Promise<MonthlyRevenuePoint[]> {
    const qs = new URLSearchParams();
    qs.set("rollingMonths", String(months));
    const url = this.createURL("/admin/wallet/monthly-revenue", qs);
    return this.get<MonthlyRevenuePoint[]>(url);
  }

  async getMobileMoneyBalance(): Promise<AdminMobileMoneyBalanceResult> {
    const url = this.createURL(
      "/admin/wallet/mobile-money/balance",
      new URLSearchParams(),
    );
    return this.get<AdminMobileMoneyBalanceResult>(url);
  }

  /**
   * Gateway names and operator codes come from the backend registry so adding a
   * provider does not need a matching constant shipped here.
   */
  async getPaymentGateways(): Promise<PaymentGatewaysResponse> {
    const url = this.createURL("/payment-gateways", new URLSearchParams());
    return this.get<PaymentGatewaysResponse>(url);
  }

  /** Countries the live gateway account holds wallets in; COG by default. */
  async getGatewayBalanceCountries(): Promise<{
    countries: GatewayCountry[];
    default: string;
  }> {
    const url = this.createURL(
      "/admin/wallet/gateway/balance-countries",
      new URLSearchParams(),
    );
    return this.get<{ countries: GatewayCountry[]; default: string }>(url);
  }

  /** Live balances of the gateway account in one country (ISO3). */
  async getGatewayBalances(
    country: string,
  ): Promise<{ country: string; balances: GatewayBalance[] }> {
    const url = this.createURL(
      "/admin/wallet/gateway/balances",
      new URLSearchParams({ country }),
    );
    return this.get<{ country: string; balances: GatewayBalance[] }>(url);
  }

  async listPayouts(params: {
    page?: number;
    limit?: number;
    status?: PayoutStatus;
  }): Promise<{ data: AdminPayoutItem[]; total: number; page: number; limit: number }> {
    const query = this.buildSearchParams({
      ...(params.page ? { page: params.page } : {}),
      ...(params.limit ? { limit: params.limit } : {}),
      ...(params.status ? { status: params.status } : {}),
    });
    const url = this.createURL("/admin/wallet/mobile-money/payouts", query);
    return this.get(url);
  }

  async sendPayout(body: SendPayoutBody): Promise<AdminPayoutItem> {
    const url = this.createURL(
      "/admin/wallet/mobile-money/payouts",
      new URLSearchParams(),
    );
    return this.post<AdminPayoutItem>(url, body);
  }

  async refreshPayout(id: string): Promise<AdminPayoutItem> {
    const url = this.createURL(
      `/admin/wallet/mobile-money/payouts/${encodeURIComponent(id)}/refresh`,
      new URLSearchParams(),
    );
    return this.post<AdminPayoutItem>(url, {});
  }

  async recordMobileMoneyWithdrawal(body: {
    amount: number;
    description?: string;
    reference?: string;
  }): Promise<{ walletId: string; newBalance: number; transactionId: string }> {
    const url = this.createURL(
      "/admin/wallet/mobile-money/withdrawal",
      new URLSearchParams(),
    );
    return this.post<{ walletId: string; newBalance: number; transactionId: string }>(url, body);
  }

  async getMobileMoneyTransactions(
    params: AdminMobileMoneyTransactionsParams,
  ): Promise<AdminMobileMoneyTransactionsResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.gateway) searchParams.gateway = params.gateway;
    if (params.operator) searchParams.operator = params.operator;
    if (params.network) searchParams.network = params.network;
    if (params.q) searchParams.q = params.q;
    if (params.type) searchParams.type = params.type;
    if (params.created_from) searchParams.created_from = params.created_from;
    if (params.created_to) searchParams.created_to = params.created_to;
    const query = this.buildSearchParams(searchParams);
    const url = this.createURL(
      "/admin/wallet/mobile-money/transactions",
      query,
    );
    return this.get<AdminMobileMoneyTransactionsResponse>(url);
  }

  async fetchInvoiceBlob(invoiceId: string): Promise<Blob> {
    const response = await fetchWithCsrfRetry(
      `${appConfig.apiUrl}/admin/invoices/${invoiceId}/download`,
      { credentials: "include" },
    );
    if (!response.ok) throw new Error("The file couldn't be downloaded. Try again.");
    return response.blob();
  }

  async downloadInvoice(invoiceId: string, filename: string): Promise<void> {
    const blob = await this.fetchInvoiceBlob(invoiceId);
    const objectUrl = URL.createObjectURL(blob);
    const a = globalThis.document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  async bulkDeleteTransactions(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/wallet/transactions/bulk-delete",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }

  async bulkRestoreTransactions(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/wallet/transactions/bulk-restore",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }

  async bulkPurgeTransactions(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/wallet/transactions/bulk-purge",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }
}

const controller = new AdminWalletController();
export const bulkDeleteWalletTransactions =
  controller.bulkDeleteTransactions.bind(controller);
export const bulkRestoreWalletTransactions =
  controller.bulkRestoreTransactions.bind(controller);
export const bulkPurgeWalletTransactions =
  controller.bulkPurgeTransactions.bind(controller);
export const getWalletInfo = controller.getInfo.bind(controller);
export const getWalletTransactions = controller.getTransactions.bind(controller);
export const getWalletPayments = controller.getPayments.bind(controller);
export const getMonthlyRevenue = controller.getMonthlyRevenue.bind(controller);
export const getRollingMonthlyRevenue =
  controller.getRollingMonthlyRevenue.bind(controller);
export const downloadAdminInvoice = controller.downloadInvoice.bind(controller);
export const fetchAdminInvoiceBlob = controller.fetchInvoiceBlob.bind(controller);
export const getMobileMoneyBalance =
  controller.getMobileMoneyBalance.bind(controller);
export const getPaymentGateways =
  controller.getPaymentGateways.bind(controller);
export const getMobileMoneyTransactions =
  controller.getMobileMoneyTransactions.bind(controller);
export const recordMobileMoneyWithdrawal =
  controller.recordMobileMoneyWithdrawal.bind(controller);
export const getGatewayBalanceCountries =
  controller.getGatewayBalanceCountries.bind(controller);
export const getGatewayBalances =
  controller.getGatewayBalances.bind(controller);
export const listPayouts = controller.listPayouts.bind(controller);
export const sendPayout = controller.sendPayout.bind(controller);
export const refreshPayout = controller.refreshPayout.bind(controller);

const EXPORT_PAGE_SIZE = 100;

export async function fetchAllWalletPayments(
  filters: Omit<AdminPaymentsListParams, "page" | "limit">,
): Promise<AdminPaymentItem[]> {
  const all: AdminPaymentItem[] = [];
  let page = 1;
  for (;;) {
    const res = await getWalletPayments({
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

export async function fetchAllWalletTransactions(
  filters: Omit<AdminWalletTransactionsParams, "page" | "limit">,
): Promise<AdminWalletTransactionItem[]> {
  const all: AdminWalletTransactionItem[] = [];
  let page = 1;
  for (;;) {
    const res = await getWalletTransactions({
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
