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

export type AdminWalletTransactionsParams = {
  page?: number;
  limit?: number;
  q?: string;
  type?: string[];
  created_from?: string;
  created_to?: string;
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
  async getInfo(): Promise<AdminWalletInfo> {
    const url = this.createURL("/admin/wallet/revenue", new URLSearchParams());
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

  async fetchInvoiceBlob(invoiceId: string): Promise<Blob> {
    const response = await fetchWithCsrfRetry(
      `${appConfig.apiUrl}/admin/invoices/${invoiceId}/download`,
      { credentials: "include" },
    );
    if (!response.ok) throw new Error("Download failed");
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
}

const controller = new AdminWalletController();
export const getWalletInfo = controller.getInfo.bind(controller);
export const getWalletTransactions = controller.getTransactions.bind(controller);
export const getWalletPayments = controller.getPayments.bind(controller);
export const getMonthlyRevenue = controller.getMonthlyRevenue.bind(controller);
export const getRollingMonthlyRevenue =
  controller.getRollingMonthlyRevenue.bind(controller);
export const downloadAdminInvoice = controller.downloadInvoice.bind(controller);
export const fetchAdminInvoiceBlob = controller.fetchInvoiceBlob.bind(controller);

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
