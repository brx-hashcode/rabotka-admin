import { AdminBaseController } from "./base-controller";

export type AdminPenaltyListItem = {
  id: string;
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  profileAvatarUrl: string | null;
  profileId: string;
  applicationId: string | null;
  jobTitle: string | null;
  amount: number;
  reason: string | null;
  appliedAt: string;
  paidAt: string | null;
  createdAt: string;
};

export type AdminPenaltiesResponse = {
  data: AdminPenaltyListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminPenaltyDetailResponse = AdminPenaltyListItem & {
  jobOfferId: string | null;
  jobScheduledAt: string | null;
  jobAmount: number | null;
  jobAddress: string | null;
  jobPaymentFlow: string | null;
  jobStatus: string | null;
  applicationStatus: string | null;
};

export type AdminPenaltiesListParams = {
  page?: number;
  limit?: number;
  q?: string;
  payment_status?: string[];
  deleted?: boolean;
};

export class AdminPenaltiesController extends AdminBaseController {
  async getList(
    params: AdminPenaltiesListParams,
  ): Promise<AdminPenaltiesResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.payment_status?.length)
      searchParams.payment_status = params.payment_status;
    if (params.deleted) searchParams.deleted = "true";

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/penalties", query);
    return this.get<AdminPenaltiesResponse>(url);
  }

  async getById(id: string): Promise<AdminPenaltyDetailResponse> {
    const url = this.createURL(
      `/admin/penalties/${id}`,
      new URLSearchParams(),
    );
    return this.get<AdminPenaltyDetailResponse>(url);
  }

  async confirmPayment(id: string): Promise<AdminPenaltyDetailResponse> {
    const url = this.createURL(
      `/admin/penalties/${id}/confirm-payment`,
      new URLSearchParams(),
    );
    return this.post<AdminPenaltyDetailResponse>(url, {});
  }

  async deletePenalty(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/penalties/${id}`,
      new URLSearchParams(),
    );
    return this.delete<{ success: boolean }>(url);
  }

  async createPenalty(body: {
    profileId: string;
    applicationId?: string;
    amount: number;
    reason: string;
  }): Promise<AdminPenaltyDetailResponse> {
    const url = this.createURL("/admin/penalties", new URLSearchParams());
    return this.post<AdminPenaltyDetailResponse>(url, body);
  }

  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/penalties/bulk-delete",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }

  async bulkRestore(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/penalties/bulk-restore",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }

  async bulkPurge(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/penalties/bulk-purge",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }
}

const controller = new AdminPenaltiesController();
export const getPenaltiesList = controller.getList.bind(controller);
export const bulkDeletePenalties = controller.bulkDelete.bind(controller);
export const bulkRestorePenalties = controller.bulkRestore.bind(controller);
export const bulkPurgePenalties = controller.bulkPurge.bind(controller);
export const getPenaltyById = controller.getById.bind(controller);
export const confirmPenaltyPayment = controller.confirmPayment.bind(controller);
export const deletePenalty = controller.deletePenalty.bind(controller);
export const createPenalty = controller.createPenalty.bind(controller);
