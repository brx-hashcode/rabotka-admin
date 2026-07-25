import { AdminBaseController } from "./base-controller";

export type AdminJobOfferListItem = {
  id: string;
  reference: string;
  title: string;
  category: { id: string; name: string } | null;
  description: string;
  scheduledAt: string;
  amount: number | null;
  paymentFlow: string | null;
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
  vectorIndexedAt: string | null;
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
  amount?: number | null;
  paymentFlow?: string | null;
  categoryId?: string | null;
  address?: string;
  note?: string;
  quantity?: number;
};

export type AdminJobOffersListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  deleted?: boolean;
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
    if (params.deleted) searchParams.deleted = "true";

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
    return this.patch<AdminJobOfferDetailResponse>(url, data);
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

  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/job-offers/bulk-delete",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }
}

const controller = new AdminJobOffersController();
export const getJobOffersList = controller.getList.bind(controller);
export const bulkDeleteJobOffers = controller.bulkDelete.bind(controller);

const EXPORT_PAGE_SIZE = 100;

/** Fetch every job offer matching the given filters, paging through the list. */
export async function fetchAllJobOffers(
  filters: Omit<AdminJobOffersListParams, "page" | "limit">,
): Promise<AdminJobOfferListItem[]> {
  const all: AdminJobOfferListItem[] = [];
  let page = 1;
  for (;;) {
    const res = await getJobOffersList({
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

export const getJobOfferById = controller.getById.bind(controller);
export const updateJobOffer = controller.updateJobOffer.bind(controller);
export const updateJobOfferStatus = controller.updateJobOfferStatus.bind(controller);
export const deleteJobOffer = controller.deleteJobOffer.bind(controller);
