import { AdminBaseController } from "./base-controller";

export type AdminLogItem = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  userName: string | null;
  profileId: string | null;
  profileName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminLogsListParams = {
  page?: number;
  limit?: number;
  q?: string;
  entity_type?: string[];
  created_from?: string;
  created_to?: string;
};

export type AdminLogsResponse = {
  data: AdminLogItem[];
  total: number;
  page: number;
  limit: number;
};

export class AdminLogsController extends AdminBaseController {
  async getList(params: AdminLogsListParams): Promise<AdminLogsResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.entity_type?.length) searchParams.entity_type = params.entity_type;
    if (params.created_from) searchParams.created_from = params.created_from;
    if (params.created_to) searchParams.created_to = params.created_to;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/log/admin", query);
    return this.get<AdminLogsResponse>(url);
  }
}

const controller = new AdminLogsController();
export const getLogsList = controller.getList.bind(controller);
