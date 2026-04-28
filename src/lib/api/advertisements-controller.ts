import { AdminBaseController } from "./base-controller";

// ─── Advertisement ───────────────────────────────────────────────────────────

export type AdvertisementStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type AdBundleSummary = {
  id: string;
  name: string;
  currency: string;
  price: number;
  max_reach: number;
  max_frequency_per_week: number;
  max_duration_days: number;
  allowed_channels: string[];
  target_audience: "WORKER" | "EMPLOYER" | "BOTH";
};

export type Advertisement = {
  id: string;
  bundle_id: string;
  bundle: AdBundleSummary | null;
  title: string;
  description: string;
  call_to_action: string | null;
  cta_url: string | null;
  image_urls: string[];
  video_url: string | null;
  banner_url: string | null;
  logo_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  sector: string | null;
  advertiser_type: string;
  language: string;
  tags: string[];
  start_date: string;
  end_date: string;
  dispatch_time: string;
  target_filters: Record<string, unknown> | null;
  status: AdvertisementStatus;
  rejection_reason: string | null;
  payment_status: string;
  budget: number | null;
  total_sent: number;
  total_opened: number;
  total_clicks: number;
  created_at: string;
  updated_at: string;
};

export type AdvertisementsListParams = {
  page?: number;
  limit?: number;
  status?: string;
  bundleId?: string;
  targetAudience?: string;
  channel?: string;
};

export type AdvertisementsListResponse = {
  data: Advertisement[];
  total: number;
  page: number;
  limit: number;
};

export type CreateAdvertisementParams = {
  bundleId: string;
  title: string;
  description: string;
  advertiserType: string;
  startDate: string;
  endDate: string;
  dispatchTime?: string;
  imageUrls?: string[];
  callToAction?: string;
  ctaUrl?: string;
  videoUrl?: string;
  bannerUrl?: string;
  logoUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  sector?: string;
  language?: string;
  tags?: string[];
};

export type UpdateAdvertisementParams = Partial<CreateAdvertisementParams>;

export type AdvertisementAnalyticsLink = {
  hash: string;
  originalUrl: string;
  clickCount: number;
  lastClickedAt: string | null;
};

export type AdvertisementTimelinePoint = {
  date: string;
  sent: number;
  clicked: number;
  failed: number;
};

export type AdvertisementDeliveryLogItem = {
  id: string;
  profileId: string;
  profileName: string;
  profileEmail: string;
  channel: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  failureReason: string | null;
};

export type AdvertisementDispatchEvent = {
  day: string;          // "YYYY-MM-DD" UTC
  dispatchedAt: string; // ISO UTC timestamp of first delivery in that batch
};

export type AdvertisementAnalytics = {
  totalSent: number;
  totalOpened: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  clickedDeliveries: number;
  clickThroughRate: number;
  remainingDays: number;
  dispatchEvents: AdvertisementDispatchEvent[];
  links: AdvertisementAnalyticsLink[];
  timeline: AdvertisementTimelinePoint[];
  deliveryLogs: AdvertisementDeliveryLogItem[];
};

// ─── Bundle ───────────────────────────────────────────────────────────────────

export type AdBundle = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  max_reach: number;
  max_frequency_per_week: number;
  max_duration_days: number;
  allowed_channels: string[];
  target_audience: "WORKER" | "EMPLOYER" | "BOTH";
  is_active: boolean;
  created_at: string;
  image_urls?: string[];
};

export type CreateBundleParams = {
  name: string;
  description: string;
  price: number;
  currency?: string;
  maxReach: number;
  maxFrequencyPerWeek: number;
  maxDurationDays: number;
  allowedChannels: string[];
  targetAudience?: "WORKER" | "EMPLOYER" | "BOTH";
  isActive?: boolean;
  imageUrls?: string[];
};

export type UpdateBundleParams = Partial<CreateBundleParams>;

class AdvertisementsController extends AdminBaseController {
  // ─── Advertisements ────────────────────────────────────────────────────────

  async listAdvertisements(
    params: AdvertisementsListParams,
  ): Promise<AdvertisementsListResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.status) searchParams.status = params.status;
    if (params.bundleId) searchParams.bundleId = params.bundleId;
    if (params.targetAudience) searchParams.targetAudience = params.targetAudience;
    if (params.channel) searchParams.channel = params.channel;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/advertisements", query);
    return this.get<AdvertisementsListResponse>(url);
  }

  async getAdvertisementById(id: string): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}`, new URLSearchParams());
    return this.get<Advertisement>(url);
  }

  async createAdvertisement(data: CreateAdvertisementParams): Promise<Advertisement> {
    const url = this.createURL("/admin/advertisements", new URLSearchParams());
    return this.post<Advertisement>(url, data as unknown as Record<string, unknown>);
  }

  async updateAdvertisement(id: string, data: UpdateAdvertisementParams): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}`, new URLSearchParams());
    return this.patch<Advertisement>(url, data as unknown as Record<string, unknown>);
  }

  async confirmPaymentAdvertisement(id: string): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}/confirm-payment`, new URLSearchParams());
    return this.post<Advertisement>(url);
  }

  async submitAdvertisement(id: string): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}/submit`, new URLSearchParams());
    return this.post<Advertisement>(url);
  }

  async approveAdvertisement(id: string): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}/approve`, new URLSearchParams());
    return this.post<Advertisement>(url);
  }

  async rejectAdvertisement(id: string, reason: string): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}/reject`, new URLSearchParams());
    return this.post<Advertisement>(url, { reason });
  }

  async pauseAdvertisement(id: string): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}/pause`, new URLSearchParams());
    return this.post<Advertisement>(url);
  }

  async resumeAdvertisement(id: string): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}/resume`, new URLSearchParams());
    return this.post<Advertisement>(url);
  }

  async cancelAdvertisement(id: string): Promise<Advertisement> {
    const url = this.createURL(`/admin/advertisements/${id}/cancel`, new URLSearchParams());
    return this.post<Advertisement>(url);
  }

  async deleteAdvertisement(id: string): Promise<{ success: boolean }> {
    const url = this.createURL(`/admin/advertisements/${id}`, new URLSearchParams());
    return this.delete<{ success: boolean }>(url);
  }

  async getAdvertisementAnalytics(id: string): Promise<AdvertisementAnalytics> {
    const url = this.createURL(
      `/admin/advertisements/${id}/analytics`,
      new URLSearchParams(),
    );
    return this.get<AdvertisementAnalytics>(url);
  }

  // ─── Bundles ───────────────────────────────────────────────────────────────

  async listBundles(): Promise<AdBundle[]> {
    const url = this.createURL(
      "/admin/advertisements/bundles",
      new URLSearchParams(),
    );
    return this.get<AdBundle[]>(url);
  }

  async createBundle(data: CreateBundleParams): Promise<AdBundle> {
    const url = this.createURL(
      "/admin/advertisements/bundles",
      new URLSearchParams(),
    );
    return this.post<AdBundle>(url, data as unknown as Record<string, unknown>);
  }

  async updateBundle(id: string, data: UpdateBundleParams): Promise<AdBundle> {
    const url = this.createURL(
      `/admin/advertisements/bundles/${id}`,
      new URLSearchParams(),
    );
    return this.patch<AdBundle>(
      url,
      data as unknown as Record<string, unknown>,
    );
  }

  async deleteBundle(id: string): Promise<void> {
    const url = this.createURL(
      `/admin/advertisements/bundles/${id}`,
      new URLSearchParams(),
    );
    await this.delete<{ success: boolean }>(url);
  }
}

const controller = new AdvertisementsController();

export const listAdvertisements = controller.listAdvertisements.bind(controller);
export const getAdvertisementById = controller.getAdvertisementById.bind(controller);
export const createAdvertisement = controller.createAdvertisement.bind(controller);
export const updateAdvertisement = controller.updateAdvertisement.bind(controller);
export const confirmPaymentAdvertisement = controller.confirmPaymentAdvertisement.bind(controller);
export const submitAdvertisement = controller.submitAdvertisement.bind(controller);
export const approveAdvertisement = controller.approveAdvertisement.bind(controller);
export const rejectAdvertisement = controller.rejectAdvertisement.bind(controller);
export const pauseAdvertisement = controller.pauseAdvertisement.bind(controller);
export const resumeAdvertisement = controller.resumeAdvertisement.bind(controller);
export const cancelAdvertisement = controller.cancelAdvertisement.bind(controller);
export const deleteAdvertisement = controller.deleteAdvertisement.bind(controller);
export const getAdvertisementAnalytics =
  controller.getAdvertisementAnalytics.bind(controller);

export const listBundles = controller.listBundles.bind(controller);
export const createBundle = controller.createBundle.bind(controller);
export const updateBundle = controller.updateBundle.bind(controller);
export const deleteBundle = controller.deleteBundle.bind(controller);
