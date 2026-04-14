import { AdminBaseController } from "./base-controller";

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
  is_active: boolean;
  created_at: string;
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
  isActive?: boolean;
};

export type UpdateBundleParams = Partial<CreateBundleParams>;

class AdvertisementsController extends AdminBaseController {
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
export const listBundles = controller.listBundles.bind(controller);
export const createBundle = controller.createBundle.bind(controller);
export const updateBundle = controller.updateBundle.bind(controller);
export const deleteBundle = controller.deleteBundle.bind(controller);
