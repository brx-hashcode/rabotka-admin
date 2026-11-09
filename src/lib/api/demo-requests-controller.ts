import { AdminBaseController } from "./base-controller";

export type DemoRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "DEMO_DONE"
  | "WON"
  | "LOST";

/** A company that asked for a Rabotka Business demo on the business site. */
export type AdminDemoRequest = {
  id: string;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  country: string;
  countryName: string;
  /** A sign-up headcount bracket: 1-5, 6-20, 21-100, 100+. */
  companySize: string;
  /** Feature slugs: analyse-cv, offres-candidatures… */
  interests: string[];
  message: string | null;
  status: DemoRequestStatus;
  notes: string | null;
};

export type AdminDemoRequestDetail = AdminDemoRequest & {
  /** Who last changed its status or notes. */
  handledBy: { id: string; name: string } | null;
};

export type AdminDemoRequestsResponse = {
  data: AdminDemoRequest[];
  total: number;
  page: number;
  limit: number;
};

export type AdminDemoRequestsListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  country?: string;
};

export class AdminDemoRequestsController extends AdminBaseController {
  async getList(
    params: AdminDemoRequestsListParams,
  ): Promise<AdminDemoRequestsResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.status?.length) searchParams.status = params.status;
    if (params.country) searchParams.country = params.country;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/demo-requests", query);
    return this.get<AdminDemoRequestsResponse>(url);
  }

  async getById(id: string): Promise<AdminDemoRequestDetail> {
    const url = this.createURL(
      `/admin/demo-requests/${id}`,
      new URLSearchParams(),
    );
    return this.get<AdminDemoRequestDetail>(url);
  }

  async update(
    id: string,
    body: { status?: DemoRequestStatus; notes?: string },
  ): Promise<AdminDemoRequestDetail> {
    const url = this.createURL(
      `/admin/demo-requests/${id}`,
      new URLSearchParams(),
    );
    return this.patch<AdminDemoRequestDetail>(url, body);
  }
}

const controller = new AdminDemoRequestsController();
export const getDemoRequestsList = controller.getList.bind(controller);
export const getDemoRequestById = controller.getById.bind(controller);
export const updateDemoRequest = controller.update.bind(controller);
