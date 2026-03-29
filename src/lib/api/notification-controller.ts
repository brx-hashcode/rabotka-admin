import { AdminBaseController } from "./base-controller";

export type AdminNotificationItem = {
  id: string;
  created_at: string;
  event: string;
  title: string;
  message: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  read: boolean;
};

export type NotificationListResponse = {
  notifications: AdminNotificationItem[];
  unreadCount: number;
};

export class AdminNotificationController extends AdminBaseController {
  async list(): Promise<NotificationListResponse> {
    const url = this.createURL(
      "/admin/notifications",
      new URLSearchParams(),
    );
    return this.get<NotificationListResponse>(url);
  }

  async markAllRead(): Promise<void> {
    const url = this.createURL(
      "/admin/notifications/mark-read",
      new URLSearchParams(),
    );
    await this.post<unknown>(url);
  }

  async clearAll(): Promise<void> {
    const url = this.createURL(
      "/admin/notifications/clear",
      new URLSearchParams(),
    );
    await this.post<unknown>(url);
  }
}

const controller = new AdminNotificationController();
export const listNotifications = controller.list.bind(controller);
export const markAllNotificationsRead =
  controller.markAllRead.bind(controller);
export const clearAllNotifications = controller.clearAll.bind(controller);
