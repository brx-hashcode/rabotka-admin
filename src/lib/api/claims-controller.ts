import { AdminBaseController } from "./base-controller";

export type AdminClaimStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export type AdminClaimItem = {
  id: string;
  title: string;
  description: string;
  status: AdminClaimStatus;
  attachmentUrls: string[];
  profileId: string;
  profileName: string | null;
  profileEmail: string | null;
  profileAvatarUrl: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedUserEmail: string | null;
  createdByUserId: string | null;
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  createdByProfileId: string | null;
  createdByProfileName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminClaimsListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  profile_id?: string;
  assigned_user_id?: string;
};

export type AdminClaimsListResponse = {
  data: AdminClaimItem[];
  total: number;
  page: number;
  limit: number;
};

export type CreateClaimPayload = {
  title: string;
  description: string;
  profile_id: string;
  attachment_urls?: string[];
  assigned_user_id?: string;
};

export type AdminClaimCommentItem = {
  id: string;
  content: string;
  userId: string | null;
  userName: string | null;
  profileId: string | null;
  profileName: string | null;
  createdByType: 'user' | 'profile';
  createdAt: string;
  updatedAt: string;
};

export type UpdateClaimPayload = {
  status?: AdminClaimStatus;
  title?: string;
  description?: string;
  attachment_urls?: string[];
  assigned_user_id?: string | null;
};

class AdminClaimsController extends AdminBaseController {
  async createClaim(payload: CreateClaimPayload): Promise<AdminClaimItem> {
    const url = this.createURL("/admin/claims", new URLSearchParams());
    return this.post<AdminClaimItem>(url, payload as Record<string, unknown>);
  }

  async listClaims(params: AdminClaimsListParams): Promise<AdminClaimsListResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.status?.length) searchParams.status = params.status;
    if (params.profile_id) searchParams.profile_id = params.profile_id;
    if (params.assigned_user_id) searchParams.assigned_user_id = params.assigned_user_id;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/claims", query);
    return this.get<AdminClaimsListResponse>(url);
  }

  async getClaimById(id: string): Promise<AdminClaimItem> {
    const url = this.createURL(`/admin/claims/${id}`, new URLSearchParams());
    return this.get<AdminClaimItem>(url);
  }

  async updateClaim(id: string, payload: UpdateClaimPayload): Promise<AdminClaimItem> {
    const url = this.createURL(`/admin/claims/${id}`, new URLSearchParams());
    return this.patch<AdminClaimItem>(url, payload as Record<string, unknown>);
  }

  async deleteClaim(id: string): Promise<void> {
    const url = this.createURL(`/admin/claims/${id}`, new URLSearchParams());
    return this.delete<void>(url);
  }

  async listComments(claimId: string): Promise<AdminClaimCommentItem[]> {
    const url = this.createURL(`/admin/claims/${claimId}/comments`, new URLSearchParams());
    return this.get<AdminClaimCommentItem[]>(url);
  }

  async addComment(claimId: string, content: string): Promise<AdminClaimCommentItem> {
    const url = this.createURL(`/admin/claims/${claimId}/comments`, new URLSearchParams());
    return this.post<AdminClaimCommentItem>(url, { content });
  }

  async deleteComment(claimId: string, commentId: string): Promise<void> {
    const url = this.createURL(`/admin/claims/${claimId}/comments/${commentId}`, new URLSearchParams());
    return this.delete<void>(url);
  }
}

const controller = new AdminClaimsController();
export const createClaim = controller.createClaim.bind(controller);
export const listClaims = controller.listClaims.bind(controller);
export const getClaimById = controller.getClaimById.bind(controller);
export const updateClaim = controller.updateClaim.bind(controller);
export const deleteClaim = controller.deleteClaim.bind(controller);
export const listClaimComments = controller.listComments.bind(controller);
export const addClaimComment = controller.addComment.bind(controller);
export const deleteClaimComment = controller.deleteComment.bind(controller);
