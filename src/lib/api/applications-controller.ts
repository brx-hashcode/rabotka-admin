import { AdminBaseController } from "./base-controller";

export type AdminApplicationListItem = {
  id: string;
  jobTitle: string;
  jobOfferId: string;
  workerName: string;
  workerEmail: string;
  workerPhone: string;
  workerAvatarUrl: string | null;
  workerId: string;
  employerName: string;
  employerEmail: string;
  employerAvatarUrl: string | null;
  employerId: string;
  status: string;
  penaltyApplied: boolean;
  penaltyAmount: number | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminApplicationsResponse = {
  data: AdminApplicationListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminApplicationPenaltyItem = {
  id: string;
  amount: number;
  reason: string | null;
  appliedAt: string;
  paidAt: string | null;
};

export type AdminApplicationDetailResponse = AdminApplicationListItem & {
  jobScheduledAt: string;
  jobAmount: number;
  jobAddress: string;
  jobPaymentFlow: string;
  jobStatus: string;
  jobQuantity: number;
  workerReliabilityScore: number | null;
  employerPhone: string;
  penalties: AdminApplicationPenaltyItem[];
  completionNote: string | null;
  contractId: string | null;
};

export type AdminApplicationsListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  penalty_applied?: string[];
  worker_id?: string;
  employer_id?: string;
};

export class AdminApplicationsController extends AdminBaseController {
  async getList(
    params: AdminApplicationsListParams,
  ): Promise<AdminApplicationsResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.status?.length) searchParams.status = params.status;
    if (params.penalty_applied?.length)
      searchParams.penalty_applied = params.penalty_applied;
    if (params.worker_id) searchParams.worker_id = params.worker_id;
    if (params.employer_id) searchParams.employer_id = params.employer_id;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/applications", query);
    return this.get<AdminApplicationsResponse>(url);
  }

  async getById(id: string): Promise<AdminApplicationDetailResponse> {
    const url = this.createURL(
      `/admin/applications/${id}`,
      new URLSearchParams(),
    );
    return this.get<AdminApplicationDetailResponse>(url);
  }
}

const controller = new AdminApplicationsController();
export const getApplicationsList = controller.getList.bind(controller);
export const getApplicationById = controller.getById.bind(controller);
