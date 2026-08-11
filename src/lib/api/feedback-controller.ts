import { AdminBaseController } from "./base-controller";

export type AdminFeedbackItem = {
  id: string;
  createdAt: string;
  score: number;
  comment: string | null;
  source: string;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    profileType: string;
  } | null;
};

export type AdminFeedbackListParams = {
  page?: number;
  limit?: number;
  q?: string;
  score?: number;
  withComment?: boolean;
};

export type AdminFeedbackListResponse = {
  data: AdminFeedbackItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminFeedbackStats = {
  total: number;
  average: number;
  withComment: number;
  /** Always all five scores, zeros included, so a bar chart has no gaps. */
  distribution: { score: number; count: number }[];
  trend: { date: string; count: number; average: number }[];
  byProfileType: { profileType: string; count: number; average: number }[];
};

class AdminFeedbackController extends AdminBaseController {
  async listFeedback(
    params: AdminFeedbackListParams,
  ): Promise<AdminFeedbackListResponse> {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));
    if (params.q) search.set("q", params.q);
    if (params.score) search.set("score", String(params.score));
    if (params.withComment) search.set("withComment", "true");
    const qs = search.toString();
    return this.get<AdminFeedbackListResponse>(
      `/admin/feedback${qs ? `?${qs}` : ""}`,
    );
  }

  async getFeedbackStats(days = 30): Promise<AdminFeedbackStats> {
    return this.get<AdminFeedbackStats>(`/admin/feedback/stats?days=${days}`);
  }
}

const controller = new AdminFeedbackController();

export const listFeedback = controller.listFeedback.bind(controller);
export const getFeedbackStats = controller.getFeedbackStats.bind(controller);
