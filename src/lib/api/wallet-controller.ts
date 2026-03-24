import { AdminBaseController } from "./base-controller";

export type AdminWalletInfo = {
  totalRevenue: number;
  balance: number;
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

export type AdminWalletTransactionsParams = {
  page?: number;
  limit?: number;
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
    if (params.type?.length) searchParams.type = params.type;
    if (params.status?.length) searchParams.status = params.status;
    if (params.created_from) searchParams.created_from = params.created_from;
    if (params.created_to) searchParams.created_to = params.created_to;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/wallet/payments", query);
    return this.get<AdminPaymentsListResponse>(url);
  }
}

const controller = new AdminWalletController();
export const getWalletInfo = controller.getInfo.bind(controller);
export const getWalletTransactions = controller.getTransactions.bind(controller);
export const getWalletPayments = controller.getPayments.bind(controller);
