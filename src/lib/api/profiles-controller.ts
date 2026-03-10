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

export type AdminKycDocumentItem = {
  id: string;
  documentType: string | null;
  documentCategory: string;
  documentUrl: string;
  verificationStatus: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export type AdminVerificationImageItem = {
  id: string;
  imageUrl: string;
  uploadedBy: string | null;
  createdAt: string;
};

export type AdminProfileDetailResponse = AdminProfileListItem & {
  jobOffersCount: number;
  applicationsCount: number;
  penaltiesCount: number;
  unpaidPenaltiesCount: number;
  kycDocuments: AdminKycDocumentItem[];
  verificationImages: AdminVerificationImageItem[];
};

export type AdminUpdateProfileParams = {
  firstName?: string;
  lastName?: string;
  description?: string;
  address?: string;
};

export type AdminVerifyProfileParams = {
  decision: "VERIFIED" | "REJECTED";
  reason?: string;
  files?: File[];
};

export type AdminUpdateStatusParams = {
  status: string;
  reason?: string;
};

export type AdminProfilePaymentRequest = {
  id: string;
  profileId: string;
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  profileStatus: string;
  profileType: string;
  status: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
  paymentReference: string | null;
  proofImages: string[];
  rejectionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminProfileMessage = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  platform: string;
  body: string;
  createdAt: string;
  sentByName: string | null;
};

export type AdminLogEntry = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  userName: string | null;
  profileId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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

  async getById(id: string): Promise<AdminProfileDetailResponse> {
    const url = this.createURL(
      `/admin/profiles/${id}`,
      new URLSearchParams(),
    );
    return this.get<AdminProfileDetailResponse>(url);
  }

  async updateProfile(
    id: string,
    data: AdminUpdateProfileParams,
  ): Promise<AdminProfileDetailResponse> {
    const url = this.createURL(
      `/admin/profiles/${id}`,
      new URLSearchParams(),
    );
    return this.patch<AdminProfileDetailResponse>(url, data);
  }

  async verifyProfile(
    id: string,
    data: AdminVerifyProfileParams,
  ): Promise<AdminProfileDetailResponse> {
    const url = this.createURL(
      `/admin/profiles/${id}/verify`,
      new URLSearchParams(),
    );
    const formData = new FormData();
    formData.append("decision", data.decision);
    if (data.reason) {
      formData.append("reason", data.reason);
    }
    if (data.files) {
      for (const file of data.files) {
        formData.append("files", file);
      }
    }
    return this.patch<AdminProfileDetailResponse>(url, formData);
  }

  async updateProfileStatus(
    id: string,
    data: AdminUpdateStatusParams,
  ): Promise<AdminProfileDetailResponse> {
    const url = this.createURL(
      `/admin/profiles/${id}/status`,
      new URLSearchParams(),
    );
    return this.patch<AdminProfileDetailResponse>(url, data);
  }

  async confirmPayment(
    id: string,
    decision: "ACCEPTED" | "REJECTED",
    reason?: string,
  ): Promise<AdminProfileDetailResponse> {
    const url = this.createURL(
      `/admin/profiles/${id}/confirm-payment`,
      new URLSearchParams(),
    );
    return this.patch<AdminProfileDetailResponse>(url, { decision, reason });
  }

  async getLogs(id: string): Promise<AdminLogEntry[]> {
    const url = this.createURL(
      `/admin/profiles/${id}/logs`,
      new URLSearchParams(),
    );
    return this.get<AdminLogEntry[]>(url);
  }

  async getPaymentRequests(id: string): Promise<AdminProfilePaymentRequest[]> {
    const url = this.createURL(
      `/admin/profiles/${id}/payment-requests`,
      new URLSearchParams(),
    );
    return this.get<AdminProfilePaymentRequest[]>(url);
  }

  async getMessages(id: string): Promise<AdminProfileMessage[]> {
    const url = this.createURL(
      `/admin/profiles/${id}/messages`,
      new URLSearchParams(),
    );
    return this.get<AdminProfileMessage[]>(url);
  }

  async sendVerificationLink(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/profiles/${id}/send-verification-link`,
      new URLSearchParams(),
    );
    return this.post<{ success: boolean }>(url, {});
  }

  async sendMessage(
    id: string,
    channel: "WHATSAPP" | "EMAIL",
    message: string,
  ): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/profiles/${id}/messages`,
      new URLSearchParams(),
    );
    return this.post<{ success: boolean }>(url, { channel, message });
  }
}

const controller = new AdminProfilesController();
export const getProfilesList = controller.getList.bind(controller);
export const getProfileById = controller.getById.bind(controller);
export const updateProfile = controller.updateProfile.bind(controller);
export const verifyProfile = controller.verifyProfile.bind(controller);
export const updateProfileStatus =
  controller.updateProfileStatus.bind(controller);
export const confirmPayment = controller.confirmPayment.bind(controller);
export const getProfileLogs = controller.getLogs.bind(controller);
export const getProfilePaymentRequests = controller.getPaymentRequests.bind(controller);
export const sendProfileMessage = controller.sendMessage.bind(controller);
export const getProfileMessages = controller.getMessages.bind(controller);
export const sendVerificationLink = controller.sendVerificationLink.bind(controller);
