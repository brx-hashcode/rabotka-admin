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
  /**
   * Who performed the assignment, and therefore the only admin the server will
   * let change it (a SUPER_ADMIN aside). Null means nobody is assigned, or the
   * assignment predates the column — in both cases anyone may change it.
   */
  assignedByUserId?: string | null;
  assignedByUserName?: string | null;
  createdByUserId: string | null;
  createdByUserName: string | null;
  createdByUserEmail: string | null;
  createdByProfileId: string | null;
  createdByProfileName: string | null;
  /** Manual rank within the board column, ascending. Ties break on createdAt desc. */
  position: number;
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
  /** Empty for an image-only comment. */
  content: string;
  /**
   * Optional because a bundle can outlive the backend it talks to: a deploy
   * where this ships first returns comments without the field, and every read
   * site would crash on `.map`. Read it as `?? []`.
   */
  attachmentUrls?: string[];
  userId: string | null;
  userName: string | null;
  profileId: string | null;
  profileName: string | null;
  createdByType: 'user' | 'profile';
  createdAt: string;
  updatedAt: string;
};

export type ReorderClaimPayload = {
  status: AdminClaimStatus;
  /** Slot the claim should occupy in that column once it has landed, counting itself. */
  index: number;
};

export type AddClaimCommentPayload = {
  /** Omit for an image-only comment; the server requires one or the other. */
  content?: string;
  attachment_urls?: string[];
};

export type ClaimAttachmentUploadResponse = {
  files: { url: string; key: string; name: string }[];
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
    return this.post<AdminClaimItem>(url, payload);
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
    return this.patch<AdminClaimItem>(url, payload);
  }

  async reorderClaim(
    id: string,
    payload: ReorderClaimPayload,
  ): Promise<AdminClaimItem> {
    const url = this.createURL(`/admin/claims/${id}/position`, new URLSearchParams());
    return this.patch<AdminClaimItem>(url, payload);
  }

  async deleteClaim(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(`/admin/claims/${id}`, new URLSearchParams());
    return this.delete<{ success: boolean }>(url);
  }

  async listComments(claimId: string): Promise<AdminClaimCommentItem[]> {
    const url = this.createURL(`/admin/claims/${claimId}/comments`, new URLSearchParams());
    return this.get<AdminClaimCommentItem[]>(url);
  }

  /**
   * The signature takes a payload rather than a second argument on purpose:
   * changing it forces every call site to be visited when attachments landed.
   */
  async addComment(
    claimId: string,
    payload: AddClaimCommentPayload,
  ): Promise<AdminClaimCommentItem> {
    const url = this.createURL(`/admin/claims/${claimId}/comments`, new URLSearchParams());
    return this.post<AdminClaimCommentItem>(url, payload);
  }

  /**
   * Upload claim images and get back urls to reference.
   *
   * Replaces the hand-rolled `fetchWithCsrfRetry` + FormData helper that sat
   * inside `create-claim-modal.tsx` and pointed at the generic `/file/upload`,
   * which accepts any mime type. `AdminBaseController` already accepts a
   * FormData body, so this belongs here like `chat-controller`'s.
   */
  async uploadAttachments(files: File[]): Promise<string[]> {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    const url = this.createURL("/admin/claims/attachments", new URLSearchParams());
    const response = await this.post<ClaimAttachmentUploadResponse>(url, formData);
    return response.files.map((f) => f.url);
  }

  async deleteComment(claimId: string, commentId: string): Promise<{ success: boolean }> {
    const url = this.createURL(`/admin/claims/${claimId}/comments/${commentId}`, new URLSearchParams());
    return this.delete<{ success: boolean }>(url);
  }
}

const controller = new AdminClaimsController();
export const createClaim = controller.createClaim.bind(controller);
export const listClaims = controller.listClaims.bind(controller);
export const getClaimById = controller.getClaimById.bind(controller);
export const updateClaim = controller.updateClaim.bind(controller);
export const reorderClaim = controller.reorderClaim.bind(controller);
export const deleteClaim = controller.deleteClaim.bind(controller);
export const listClaimComments = controller.listComments.bind(controller);
export const addClaimComment = controller.addComment.bind(controller);
export const deleteClaimComment = controller.deleteComment.bind(controller);
export const uploadClaimAttachments =
  controller.uploadAttachments.bind(controller);
