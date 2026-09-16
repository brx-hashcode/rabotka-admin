import { AdminBaseController } from "./base-controller";

export type AdminProfileNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  actorAvatarUrl: string | null;
  createdAt: string;
  readAt: string | null;
  /** Cleared by the profile from their own feed; still listed here. */
  dismissedAt: string | null;
  /**
   * Who caused it — shown to admins only. The profile itself sees an
   * anonymised sentence.
   */
  actor: {
    profileId: string;
    firstName: string;
    lastName: string;
    profileType: string;
  } | null;
};

export type AdminProfileNotificationsPage = {
  data: AdminProfileNotification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
};

export class AdminProfileNotificationsController extends AdminBaseController {
  async list(
    profileId: string,
    page = 1,
    limit = 20,
  ): Promise<AdminProfileNotificationsPage> {
    const query = this.buildSearchParams({ page, limit });
    const url = this.createURL(
      `/admin/profiles/${profileId}/notifications`,
      query,
    );
    return this.get<AdminProfileNotificationsPage>(url);
  }
}

const controller = new AdminProfileNotificationsController();
export const getProfileNotifications = controller.list.bind(controller);
