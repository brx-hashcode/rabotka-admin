import { AdminBaseController } from "./base-controller";
import { appConfig } from "#/config";
import { fetchWithCsrfRetry } from "./csrf-token";

export type AdminInvoiceItem = {
  id: string;
  profileId: string;
  paymentRequestId: string;
  amount: string;
  reason: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  status: string;
  createdAt: string;
};

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
  /** Admin note from the latest KYC decision (approve or reject). */
  kycVerificationNote: string | null;
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
  categoryId: string | null;
  categoryName: string | null;
  categoryIds: string[];
  categoryNames: string[];
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
  reason: string;
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

export type AdminProfileWalletTransaction = {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};

export type AdminProfileWallet = {
  balance: number;
  transactions: AdminProfileWalletTransaction[];
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
    formData.append("reason", data.reason);
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

  async getWallet(id: string): Promise<AdminProfileWallet> {
    const url = this.createURL(
      `/admin/profiles/${id}/wallet`,
      new URLSearchParams(),
    );
    return this.get<AdminProfileWallet>(url);
  }

  async creditWallet(
    id: string,
    amount: number,
    note?: string,
  ): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/profiles/${id}/wallet/credit`,
      new URLSearchParams(),
    );
    return this.post<{ success: boolean }>(url, { amount, note });
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
    files?: File[],
  ): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/profiles/${id}/messages`,
      new URLSearchParams(),
    );
    if (files?.length && channel === "EMAIL") {
      const form = new FormData();
      form.append("channel", channel);
      form.append("message", message);
      for (const f of files) form.append("attachments", f);
      return this.post<{ success: boolean }>(url, form);
    }
    return this.post<{ success: boolean }>(url, { channel, message });
  }

  async updateAvatar(id: string, file: File): Promise<{ avatarUrl: string }> {
    const url = this.createURL(`/admin/profiles/${id}/avatar`, new URLSearchParams());
    const formData = new FormData();
    formData.append("avatar", file);
    return this.patch<{ avatarUrl: string }>(url, formData);
  }

  async getInvoices(profileId: string): Promise<AdminInvoiceItem[]> {
    const url = this.createURL(
      `/admin/profiles/${profileId}/invoices`,
      new URLSearchParams(),
    );
    return this.get<AdminInvoiceItem[]>(url);
  }

  async downloadProfileAgreement(profileId: string): Promise<Blob> {
    const response = await fetchWithCsrfRetry(
      `${appConfig.apiUrl}/admin/profiles/${profileId}/agreement/download`,
      { credentials: "include" },
    );
    if (!response.ok) throw new Error("Download failed");
    return response.blob();
  }
}

const controller = new AdminProfilesController();
export const getProfilesList = controller.getList.bind(controller);
export const getProfileById = controller.getById.bind(controller);
export const updateProfile = controller.updateProfile.bind(controller);
export const verifyProfile = controller.verifyProfile.bind(controller);
export const updateProfileStatus =
  controller.updateProfileStatus.bind(controller);
export const getProfileLogs = controller.getLogs.bind(controller);
export const getProfilePaymentRequests = controller.getPaymentRequests.bind(controller);
export const sendProfileMessage = controller.sendMessage.bind(controller);
export const getProfileMessages = controller.getMessages.bind(controller);
export const getProfileWallet = controller.getWallet.bind(controller);
export const creditProfileWallet = controller.creditWallet.bind(controller);
export const sendVerificationLink = controller.sendVerificationLink.bind(controller);
export const downloadAdminProfileAgreement = controller.downloadProfileAgreement.bind(controller);
export const getProfileInvoices = controller.getInvoices.bind(controller);
export const updateProfileAvatar = controller.updateAvatar.bind(controller);
