import { AdminBaseController } from "./base-controller";
import { appConfig } from "#/config";
import { fetchWithCsrfRetry } from "./csrf-token";

/** What the assistant carries about someone between conversations. */
export type AdminVovaMemoryFact = {
  /** One short sentence, as the assistant will read it back. */
  text: string;
  /** ISO date the fact was last seen to hold. */
  at: string;
};

export type AdminVovaMemory = {
  facts: AdminVovaMemoryFact[];
  /** Null when nothing has ever been remembered — the ordinary state. */
  updatedAt: string | null;
};

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

export type ReferralStatus =
  | "PENDING"
  | "QUALIFIED_ON_HOLD"
  | "REWARDED"
  | "CAPPED"
  | "FORFEITED";

export type ReferralSource = "LINK" | "MANUAL_CODE" | "BOT" | "ADMIN";

/**
 * Who invited a profile. Read off the Referral relation rather than a column on
 * the profile, so this and the payout logic cannot disagree about it.
 */
export type AdminProfileReferredBy = {
  profileId: string;
  firstName: string;
  lastName: string;
  code: string;
  source: ReferralSource;
  status: ReferralStatus;
  rewardedAt: string | null;
  referrerAmount: number | null;
  /** Why nothing was paid, when the status says nothing was. */
  settlementNote: string | null;
};

export type AdminProfileListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /**
   * Optional second number to be reached on, when the WhatsApp number is not
   * one the person answers calls on. Selected on the detail read only, so this
   * is undefined on rows that came from the list endpoint.
   */
  directPhone?: string | null;
  address: string;
  countryCode: string | null;
  countryName: string | null;
  city: string | null;
  /** Null unless geocoding succeeded; it is fire-and-forget, so gaps are normal. */
  latitude: number | null;
  longitude: number | null;
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
  /** Every trade this profile works in — a worker may have several. */
  categoryIds: string[];
  categoryNames: string[];
  ratingAvg: number | null;
  ratingCount: number;
  billingStatus: string;
  suspensionReason: string | null;
  suspendedAt: string | null;
  lastLoginAt: string | null;
  /** First time the account became usable. Not a sign-in — activation mints no session. */
  activatedAt: string | null;
  firstLogin: boolean;
  readAndApprovedPolicies: boolean;
  portfolioSlug: string | null;
  /** When this profile last reached the vector index; null means never. */
  vectorIndexedAt: string | null;
  jobOffersCount: number;
  applicationsCount: number;
  penaltiesCount: number;
  unpaidPenaltiesCount: number;
};

/** What the bytes are, decided server-side. The stream url has no extension,
 *  so there is nothing here to sniff. */
export type KycContentKind = "image" | "pdf" | "other";

export type AdminKycDocumentItem = {
  id: string;
  documentType: string | null;
  documentCategory: string;
  /**
   * No url. `documentUrl` used to sit here and was either a signed url that
   * died within the hour — which is why documents rendered as broken images —
   * or a permanent public link to somebody's ID card. The bytes now come from
   * `kycDocumentRawUrl()`, behind the admin session.
   */
  fileAvailable: boolean;
  contentKind: KycContentKind;
  verificationStatus: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export type AdminVerificationImageItem = {
  id: string;
  fileAvailable: boolean;
  contentKind: KycContentKind;
  uploadedBy: string | null;
  createdAt: string;
};

/**
 * Where to fetch a KYC document's bytes.
 *
 * Same-origin under `appConfig.apiUrl`, so the session cookie rides along on a
 * bare `<img src>` with no token in the query string and nothing to leak.
 */
export function kycDocumentRawUrl(profileId: string, documentId: string) {
  return `${appConfig.apiUrl}/admin/profiles/${profileId}/kyc-documents/${documentId}/raw`;
}

export function kycVerificationImageRawUrl(profileId: string, imageId: string) {
  return `${appConfig.apiUrl}/admin/profiles/${profileId}/verification-images/${imageId}/raw`;
}

export type AdminProfileDetailResponse = AdminProfileListItem & {
  /** Legacy single category, superseded by `categoryIds`/`categoryNames`. */
  categoryId: string | null;
  categoryName: string | null;
  kycDocuments: AdminKycDocumentItem[];
  verificationImages: AdminVerificationImageItem[];
  /**
   * Parrainage. Detail-only: the list endpoint does not join the Referral
   * relation, so putting these on AdminProfileListItem would promise every
   * table row a field the API never sends.
   */
  referredBy: AdminProfileReferredBy | null;
  /** How many people this profile has invited, in any payout state. */
  referralsMadeCount: number;
};

export type AdminUpdateProfileParams = {
  firstName?: string;
  lastName?: string;
  description?: string;
  address?: string;
  countryCode?: string;
  countryName?: string;
  city?: string;
  email?: string;
  phone?: string;
  /** Send "" to clear it. Not unique, never used for login. */
  directPhone?: string;
  /** Changing this re-indexes the profile into the other vector collection. */
  profileType?: string;
};

/**
 * One supporting image, already uploaded via `uploadVerificationImage`.
 *
 * `url` is a signed preview that expires within the hour; the API never stores
 * it and reads it only to re-derive the key. `key` is the durable half.
 */
export type AdminVerifyDocumentRef = {
  key: string;
  url?: string;
};

export type AdminVerifyProfileParams = {
  decision: "VERIFIED" | "REJECTED";
  reason: string;
  /**
   * Descriptors, not bytes. Send EXACTLY `{ key, url }` per item — the API runs
   * `forbidNonWhitelisted`, so an extra property is a 400 for the whole request.
   */
  documents?: AdminVerifyDocumentRef[];
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

export type MessageChannel = "WHATSAPP" | "EMAIL";

/** How a WhatsApp message would be delivered right now. */
export type MessageDeliveryMode = "FREE_FORM" | "TEMPLATE";

/**
 * State of the profile's 24h WhatsApp customer-service window.
 *
 * Advisory: the window can open or lapse between this call and the send, so the
 * backend recomputes it and is authoritative. Used to tell the admin which mode
 * their message will go out in, never to block them from sending.
 */
export type WhatsAppWindowState = {
  windowOpen: boolean;
  lastInboundAt: string | null;
  mode: MessageDeliveryMode;
  hasPhone: boolean;
};

/** `deliveryMode` is null for EMAIL, which has no service window. */
export type SendMessageResult = {
  success: boolean;
  deliveryMode: MessageDeliveryMode | null;
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
  deleted?: boolean;
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
    if (params.deleted) searchParams.deleted = "true";

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
    // JSON, not multipart. The images went up one at a time through
    // `uploadVerificationImage` while the admin was reviewing, so this request
    // is a few hundred bytes regardless of how many were attached.
    return this.patch<AdminProfileDetailResponse>(
      url,
      data as unknown as Record<string, unknown>,
    );
  }

  /**
   * Upload one KYC verification image and get its descriptor back.
   *
   * Mirrors the client's onboarding `POST /profile/kyc-upload`: the file goes up
   * as the admin picks it, and the verify call afterwards carries only keys.
   * That is what makes a single failed photograph retryable on its own instead
   * of taking the whole review down with it.
   */
  async uploadVerificationImage(
    profileId: string,
    file: File,
  ): Promise<AdminVerifyDocumentRef & { url: string }> {
    const url = this.createURL(
      `/admin/profiles/${profileId}/verification-images`,
      new URLSearchParams(),
    );
    const formData = new FormData();
    formData.append("file", file);
    return this.post<AdminVerifyDocumentRef & { url: string }>(url, formData);
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

  async getVovaMemory(id: string): Promise<AdminVovaMemory> {
    const url = this.createURL(
      `/admin/profiles/${id}/vova-memory`,
      new URLSearchParams(),
    );
    return this.get<AdminVovaMemory>(url);
  }

  async eraseVovaMemory(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(
      `/admin/profiles/${id}/vova-memory`,
      new URLSearchParams(),
    );
    return this.delete<{ success: boolean }>(url);
  }

  async getWhatsAppWindow(id: string): Promise<WhatsAppWindowState> {
    const url = this.createURL(
      `/admin/profiles/${id}/whatsapp-window`,
      new URLSearchParams(),
    );
    return this.get<WhatsAppWindowState>(url);
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
    channel: MessageChannel,
    message: string,
    files?: File[],
  ): Promise<SendMessageResult> {
    const url = this.createURL(
      `/admin/profiles/${id}/messages`,
      new URLSearchParams(),
    );
    if (files?.length && channel === "EMAIL") {
      const form = new FormData();
      form.append("channel", channel);
      form.append("message", message);
      for (const f of files) form.append("attachments", f);
      return this.post<SendMessageResult>(url, form);
    }
    return this.post<SendMessageResult>(url, { channel, message });
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

  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/profiles/bulk-delete",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }

  async bulkRestore(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/profiles/bulk-restore",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }

  async bulkPurge(ids: string[]): Promise<{ count: number }> {
    const url = this.createURL(
      "/admin/profiles/bulk-purge",
      new URLSearchParams(),
    );
    return this.post<{ count: number }>(url, { ids });
  }
}

const controller = new AdminProfilesController();
export const getProfilesList = controller.getList.bind(controller);
export const bulkDeleteProfiles = controller.bulkDelete.bind(controller);
export const bulkRestoreProfiles = controller.bulkRestore.bind(controller);
export const bulkPurgeProfiles = controller.bulkPurge.bind(controller);

const EXPORT_PAGE_SIZE = 100;

/** Fetch every profile matching the given filters, paging through the list. */
export async function fetchAllProfiles(
  filters: Omit<AdminProfilesListParams, "page" | "limit">,
): Promise<AdminProfileListItem[]> {
  const all: AdminProfileListItem[] = [];
  let page = 1;
  for (;;) {
    const res = await getProfilesList({
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
export const getProfileById = controller.getById.bind(controller);
export const updateProfile = controller.updateProfile.bind(controller);
export const verifyProfile = controller.verifyProfile.bind(controller);
export const uploadKycVerificationImage =
  controller.uploadVerificationImage.bind(controller);
export const updateProfileStatus =
  controller.updateProfileStatus.bind(controller);
export const getProfileLogs = controller.getLogs.bind(controller);
export const getProfilePaymentRequests = controller.getPaymentRequests.bind(controller);
export const sendProfileMessage = controller.sendMessage.bind(controller);
export const getProfileMessages = controller.getMessages.bind(controller);
export const getProfileVovaMemory = controller.getVovaMemory.bind(controller);
export const eraseProfileVovaMemory =
  controller.eraseVovaMemory.bind(controller);
export const getProfileWhatsAppWindow =
  controller.getWhatsAppWindow.bind(controller);
export const getProfileWallet = controller.getWallet.bind(controller);
export const creditProfileWallet = controller.creditWallet.bind(controller);
export const sendVerificationLink = controller.sendVerificationLink.bind(controller);
export const downloadAdminProfileAgreement = controller.downloadProfileAgreement.bind(controller);
export const getProfileInvoices = controller.getInvoices.bind(controller);
export const updateProfileAvatar = controller.updateAvatar.bind(controller);
