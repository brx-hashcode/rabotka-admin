import { AdminBaseController } from "./base-controller";

export type PaymentRequestStatus =
  | "PENDING"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type AdminPaymentRequestListItem = {
  id: string;
  profileId: string;
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  profileStatus: string;
  profileType: string;
  status: PaymentRequestStatus;
  gateway: string | null;
  gatewayPaymentRef: string | null;
  paymentReference: string | null;
  proofImages: string[];
  rejectionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPaymentRequestsResponse = {
  data: AdminPaymentRequestListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminPaymentRequestsListParams = {
  page?: number;
  limit?: number;
  status?: PaymentRequestStatus;
  deleted?: boolean;
};

export class AdminPaymentRequestsController extends AdminBaseController {
  async getList(
    params: AdminPaymentRequestsListParams,
  ): Promise<AdminPaymentRequestsResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.status) searchParams.status = params.status;
    if (params.deleted) searchParams.deleted = "true";

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/payment-requests", query);
    return this.get<AdminPaymentRequestsResponse>(url);
  }

  async createPaymentLink(profileId: string): Promise<{ paymentUrl: string }> {
    const url = this.createURL(
      "/admin/payment-requests",
      new URLSearchParams(),
    );
    return this.post<{ paymentUrl: string }>(url, { profileId });
  }

  async approve(id: string): Promise<AdminPaymentRequestListItem> {
    const url = this.createURL(
      `/admin/payment-requests/${id}/approve`,
      new URLSearchParams(),
    );
    return this.post<AdminPaymentRequestListItem>(url, {});
  }

  async reject(
    id: string,
    note: string,
  ): Promise<AdminPaymentRequestListItem> {
    const url = this.createURL(
      `/admin/payment-requests/${id}/reject`,
      new URLSearchParams(),
    );
    return this.post<AdminPaymentRequestListItem>(url, { note });
  }

  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/payment-requests/bulk-delete",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }

  async bulkRestore(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/payment-requests/bulk-restore",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }

  async bulkPurge(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/payment-requests/bulk-purge",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }
}

const controller = new AdminPaymentRequestsController();
export const getPaymentRequestsList = controller.getList.bind(controller);
export const bulkDeletePaymentRequests =
  controller.bulkDelete.bind(controller);
export const bulkRestorePaymentRequests =
  controller.bulkRestore.bind(controller);
export const bulkPurgePaymentRequests = controller.bulkPurge.bind(controller);
export const createPaymentLink = controller.createPaymentLink.bind(controller);
export const approvePaymentRequest = controller.approve.bind(controller);
export const rejectPaymentRequest = controller.reject.bind(controller);
