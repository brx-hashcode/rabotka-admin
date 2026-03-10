import { AdminBaseController } from "./base-controller";

export type AdminPenaltyListItem = {
  id: string;
  workerName: string;
  workerEmail: string;
  workerPhone: string;
  workerAvatarUrl: string | null;
  workerId: string;
  applicationId: string;
  jobTitle: string;
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
  jobOfferId: string;
  jobScheduledAt: string;
  jobAmount: number;
  jobAddress: string;
  jobPaymentFlow: string;
  jobStatus: string;
  applicationStatus: string;
};

export type AdminPenaltiesListParams = {
  page?: number;
  limit?: number;
  q?: string;
  payment_status?: string[];
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
}

const controller = new AdminPenaltiesController();
export const getPenaltiesList = controller.getList.bind(controller);
export const getPenaltyById = controller.getById.bind(controller);
