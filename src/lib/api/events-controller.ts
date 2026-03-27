import { AdminBaseController } from "./base-controller";
import type { TEventColor, TDeliveryChannel } from "#/features/calendar/types";

export type AdminEventUser = {
  id: string;
  name: string;
  picturePath: string | null;
};

export type AdminEventProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type AdminEvent = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  color: TEventColor;
  channel: TDeliveryChannel;
  location: string | null;
  user: AdminEventUser;
  profiles: AdminEventProfile[];
  assignedUsers: AdminEventUser[];
  createdAt: string;
  updatedAt: string;
};

export type CreateEventParams = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  color: string;
  channel: TDeliveryChannel;
  location?: string;
  profileIds?: string[];
  userIds?: string[];
};

export type UpdateEventParams = Partial<CreateEventParams>;

export type AdminEventsListResponse = {
  data: AdminEvent[];
  total: number;
  page: number;
  limit: number;
};

export class AdminEventsController extends AdminBaseController {
  async getList(params: { page?: number; limit?: number } = {}): Promise<AdminEventsListResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/event", query);
    return this.get<AdminEventsListResponse>(url);
  }

  async create(data: CreateEventParams): Promise<AdminEvent> {
    const url = this.createURL("/admin/event", new URLSearchParams());
    return this.post<AdminEvent>(url, data as unknown as Record<string, unknown>);
  }

  async update(id: number, data: UpdateEventParams): Promise<AdminEvent> {
    const url = this.createURL(`/admin/event/${id}`, new URLSearchParams());
    return this.patch<AdminEvent>(url, data as unknown as Record<string, unknown>);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const url = this.createURL(`/admin/event/${id}`, new URLSearchParams());
    return this.delete<{ success: boolean }>(url);
  }
}

const controller = new AdminEventsController();
export const getEventsList = controller.getList.bind(controller);
export const createEvent = (data: CreateEventParams) => controller.create(data);
export const updateEvent = (id: number, data: UpdateEventParams) => controller.update(id, data);
export const deleteEvent = (id: number) => controller.remove(id);
