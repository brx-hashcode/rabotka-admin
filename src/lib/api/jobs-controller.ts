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

export type AdminJobOffersResponse = {
  data: AdminJobOfferListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminJobOffersListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  payment_flow?: string[];
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
    if (params.payment_flow?.length)
      searchParams.payment_flow = params.payment_flow;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/job-offers", query);
    return this.get<AdminJobOffersResponse>(url);
  }
}

const controller = new AdminJobOffersController();
export const getJobOffersList = controller.getList.bind(controller);
