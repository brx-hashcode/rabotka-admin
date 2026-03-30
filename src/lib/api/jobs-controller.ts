import { AdminBaseController } from "./base-controller";

export type AdminJobOfferListItem = {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  amount: number;
  paymentFlow: string;
  address: string;
  note: string | null;
  quantity: number;
  status: string;
  employerName: string;
  employerEmail: string;
  employerPhone: string;
  employerAvatarUrl: string | null;
  employerId: string;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminJobApplicationItem = {
  id: string;
  workerName: string;
  workerEmail: string;
  workerPhone: string;
  workerAvatarUrl: string | null;
  workerId: string;
  status: string;
  penaltyApplied: boolean;
  penaltyAmount: number | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
};

export type AdminJobOfferDetailResponse = AdminJobOfferListItem & {
  applications: AdminJobApplicationItem[];
};

export type AdminJobOffersResponse = {
  data: AdminJobOfferListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUpdateJobOfferParams = {
  title?: string;
  description?: string;
  scheduledAt?: string;
  amount?: number;
  address?: string;
  note?: string;
  quantity?: number;
};

export type AdminJobOffersListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
};

export class AdminJobOffersController extends AdminBaseController {
  async getList(
    params: AdminJobOffersListParams,
  ): Promise<AdminJobOffersResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.status?.length) searchParams.status = params.status;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/job-offers", query);
    return this.get<AdminJobOffersResponse>(url);
  }

  async getById(id: string): Promise<AdminJobOfferDetailResponse> {
    const url = this.createURL(
      `/admin/job-offers/${id}`,
      new URLSearchParams(),
    );
    return this.get<AdminJobOfferDetailResponse>(url);
  }

  async updateJobOffer(
    id: string,
    data: AdminUpdateJobOfferParams,
  ): Promise<AdminJobOfferDetailResponse> {
    const url = this.createURL(
      `/admin/job-offers/${id}`,
      new URLSearchParams(),
    );
    return this.patch<AdminJobOfferDetailResponse>(url, data as Record<string, unknown>);
  }

  async updateJobOfferStatus(
    id: string,
    status: string,
  ): Promise<AdminJobOfferDetailResponse> {
    const url = this.createURL(
      `/admin/job-offers/${id}/status`,
      new URLSearchParams(),
    );
    return this.patch<AdminJobOfferDetailResponse>(url, { status });
  }

  async deleteJobOffer(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/job-offers/${id}`,
      new URLSearchParams(),
    );
    return this.delete<{ success: boolean }>(url);
  }
}

const controller = new AdminJobOffersController();
export const getJobOffersList = controller.getList.bind(controller);
export const getJobOfferById = controller.getById.bind(controller);
export const updateJobOffer = controller.updateJobOffer.bind(controller);
export const updateJobOfferStatus = controller.updateJobOfferStatus.bind(controller);
export const deleteJobOffer = controller.deleteJobOffer.bind(controller);
