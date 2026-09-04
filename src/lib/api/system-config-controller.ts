import { AdminBaseController } from "./base-controller";

export type ConfigCategory =
  | "CONTACT"
  | "FEES"
  | "MATCHING"
  | "STORAGE"
  | "TWILIO"
  | "GENERAL";

export type SystemConfigItem = {
  key: string;
  value: string;
  category: ConfigCategory;
  label: string;
  isSecret: boolean;
  updatedAt: string;
  updatedBy: string | null;
};

class SystemConfigController extends AdminBaseController {
  getAll(category?: ConfigCategory): Promise<SystemConfigItem[]> {
    const query = category ? `?category=${category}` : "";
    return this.get<SystemConfigItem[]>(`/admin/system-configs${query}`);
  }

  getOne(key: string): Promise<SystemConfigItem> {
    return this.get<SystemConfigItem>(`/admin/system-configs/${encodeURIComponent(key)}`);
  }

  update(key: string, value: string): Promise<void> {
    return this.patch<void>(`/admin/system-configs/${encodeURIComponent(key)}`, { value });
  }

  /**
   * Write several keys as one transaction.
   *
   * Not an optimisation. Some rules span keys — the parrainage commission type
   * decides whether the two credit values are francs or percentages, and in
   * PERCENTAGE mode they must sum to at most 100 — so "300 FCFA → 60 %" is
   * three writes that are each invalid alone and only coherent together. Sent
   * one at a time, the server rejects whichever arrives first.
   */
  updateMany(values: Record<string, string>): Promise<void> {
    return this.patch<void>("/admin/system-configs", { values });
  }
}

const systemConfigController = new SystemConfigController();

export const getSystemConfigs = (category?: ConfigCategory) =>
  systemConfigController.getAll(category);

export const getSystemConfig = (key: string) =>
  systemConfigController.getOne(key);

export const updateSystemConfig = (key: string, value: string) =>
  systemConfigController.update(key, value);

export const updateSystemConfigs = (values: Record<string, string>) =>
  systemConfigController.updateMany(values);
