import { AdminBaseController } from "./base-controller";

export type AdminProfileListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  status: string;
  profileType: string;
  whatsappConnected: boolean;
  verificationStatus: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  reliabilityScore: number | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminProfilesResponse = {
  data: AdminProfileListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminProfilesListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  profile_type?: string[];
  whatsapp_connected?: boolean;
  verification_status?: string[];
};

export class AdminProfilesController extends AdminBaseController {
  async getList(params: AdminProfilesListParams): Promise<AdminProfilesResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.status?.length) searchParams.status = params.status;
    if (params.profile_type?.length) searchParams.profile_type = params.profile_type;
    if (params.whatsapp_connected !== undefined)
      searchParams.whatsapp_connected = params.whatsapp_connected;
    if (params.verification_status?.length)
      searchParams.verification_status = params.verification_status;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/profiles", query);
    return this.get<AdminProfilesResponse>(url);
  }
}

const controller = new AdminProfilesController();
export const getProfilesList = controller.getList.bind(controller);
