import { AdminBaseController } from "./base-controller";

export type ConfigCategory =
  | "CONTACT"
  | "FEES"
  | "MATCHING"
  | "STORAGE"
  | "TWILIO"
  | "GENERAL"
  | "MONETBIL";

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
}

const systemConfigController = new SystemConfigController();

export const getSystemConfigs = (category?: ConfigCategory) =>
  systemConfigController.getAll(category);

export const getSystemConfig = (key: string) =>
  systemConfigController.getOne(key);

export const updateSystemConfig = (key: string, value: string) =>
  systemConfigController.update(key, value);
