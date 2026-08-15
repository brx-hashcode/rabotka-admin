import { AdminBaseController } from "./base-controller";
import type {
  TEventColor,
  TDeliveryChannel,
  TEventEditScope,
  TRecurrenceFrequency,
} from "#/features/calendar/types";

/** The repeat rule as sent. `until` and `count` are mutually exclusive. */
export type EventRecurrenceParams = {
  frequency: TRecurrenceFrequency;
  until?: string;
  count?: number;
};

export type AdminEventRecurrence = {
  frequency: TRecurrenceFrequency;
  until: string | null;
  count: number | null;
};

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
  seriesId: string | null;
  occurrenceIndex: number | null;
  recurrence: AdminEventRecurrence | null;
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
  /** Omit for a one-off event. */
  recurrence?: EventRecurrenceParams;
};

export type UpdateEventParams = Partial<CreateEventParams> & {
  /** Which occurrences the edit reaches. Ignored on a one-off; defaults to THIS. */
  scope?: TEventEditScope;
};

export type AdminEventsListResponse = {
  data: AdminEvent[];
  total: number;
  page: number;
  limit: number;
};

export class AdminEventsController extends AdminBaseController {
  async getList(
    params: { page?: number; limit?: number; from?: string; to?: string } = {},
  ): Promise<AdminEventsListResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    // Both or neither — the server ignores a lone bound, so sending one would
    // quietly return everything.
    if (params.from != null && params.to != null) {
      searchParams.from = params.from;
      searchParams.to = params.to;
    }
    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/event", query);
    return this.get<AdminEventsListResponse>(url);
  }

  async create(data: CreateEventParams): Promise<AdminEvent> {
    const url = this.createURL("/admin/event", new URLSearchParams());
    return this.post<AdminEvent>(url, data as unknown);
  }

  async update(id: number, data: UpdateEventParams): Promise<AdminEvent> {
    const url = this.createURL(`/admin/event/${id}`, new URLSearchParams());
    return this.patch<AdminEvent>(url, data as unknown);
  }

  async remove(
    id: number,
    scope?: TEventEditScope,
  ): Promise<{ success: boolean }> {
    // A query param, not a body: DELETE carries none here.
    const query = this.buildSearchParams(scope ? { scope } : {});
    const url = this.createURL(`/admin/event/${id}`, query);
    return this.delete<{ success: boolean }>(url);
  }
}

const controller = new AdminEventsController();
export const getEventsList = controller.getList.bind(controller);
export const createEvent = (data: CreateEventParams) => controller.create(data);
export const updateEvent = (id: number, data: UpdateEventParams) => controller.update(id, data);
export const deleteEvent = (id: number, scope?: TEventEditScope) =>
  controller.remove(id, scope);
