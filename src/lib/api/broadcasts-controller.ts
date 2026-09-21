import { AdminBaseController } from "./base-controller";

export type BroadcastStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "CANCELLED"
  | "FAILED";

export type BroadcastChannel = "IN_APP" | "WHATSAPP" | "EMAIL";

export type RecipientStatus = "PENDING" | "SENT" | "FAILED" | "READ";


export type AudienceFilters = {
  profile_types?: ("WORKER" | "EMPLOYER")[];
  statuses?: string[];
  verification_statuses?: string[];
  country_codes?: string[];
  cities?: string[];
  category_ids?: string[];
  created_from?: string;
  created_to?: string;
  active_within_days?: number;
  whatsapp_connected?: boolean;
  has_email?: boolean;
  include_profile_ids?: string[];
  exclude_profile_ids?: string[];
};

export type AudiencePreview = {
  total: number;
  reachable: { IN_APP: number; WHATSAPP: number; EMAIL: number };
  freeWhatsapp: number;
  billableWhatsapp: number;
  sample: {
    id: string;
    firstName: string;
    lastName: string;
    city: string | null;
  }[];
};

export type Broadcast = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  channels: BroadcastChannel[];
  audience: AudienceFilters;
  status: BroadcastStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  read_count: number;
  estimated_cost: number;
  created_at: string;
  updated_at: string;
};

export type BroadcastRecipient = {
  id: string;
  channel: BroadcastChannel;
  status: RecipientStatus;
  error: string | null;
  sent_at: string | null;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
};

export type BroadcastsListParams = {
  page?: number;
  limit?: number;
  status?: string[];
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type CreateBroadcastPayload = {
  title: string;
  body: string;
  link?: string;
  channels: BroadcastChannel[];
  audience: AudienceFilters;
};

export class AdminBroadcastsController extends AdminBaseController {
  async getList(params: BroadcastsListParams): Promise<Paginated<Broadcast>> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.status?.length) searchParams.status = params.status;

    const query = this.buildSearchParams(searchParams);
    return this.get<Paginated<Broadcast>>(
      this.createURL("/admin/broadcasts", query),
    );
  }

  async getById(id: string): Promise<Broadcast> {
    return this.get<Broadcast>(
      this.createURL(`/admin/broadcasts/${id}`, new URLSearchParams()),
    );
  }

  async getRecipients(
    id: string,
    params: { page?: number; limit?: number; channel?: BroadcastChannel },
  ): Promise<Paginated<BroadcastRecipient>> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.channel) searchParams.channel = params.channel;

    const query = this.buildSearchParams(searchParams);
    return this.get<Paginated<BroadcastRecipient>>(
      this.createURL(`/admin/broadcasts/${id}/recipients`, query),
    );
  }

 
  async previewAudience(audience: AudienceFilters): Promise<AudiencePreview> {
    return this.post<AudiencePreview>(
      this.createURL("/admin/broadcasts/audience/preview", new URLSearchParams()),
      { audience },
    );
  }

  async create(payload: CreateBroadcastPayload): Promise<Broadcast> {
    return this.post<Broadcast>(
      this.createURL("/admin/broadcasts", new URLSearchParams()),
      payload,
    );
  }

  async update(
    id: string,
    payload: Partial<CreateBroadcastPayload>,
  ): Promise<Broadcast> {
    return this.patch<Broadcast>(
      this.createURL(`/admin/broadcasts/${id}`, new URLSearchParams()),
      payload,
    );
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(
      this.createURL(`/admin/broadcasts/${id}`, new URLSearchParams()),
    );
  }

  async send(
    id: string,
    payload: { scheduled_at?: string } = {},
  ): Promise<{ recipientCount: number; estimatedCost: number }> {
    return this.post<{ recipientCount: number; estimatedCost: number }>(
      this.createURL(`/admin/broadcasts/${id}/send`, new URLSearchParams()),
      payload,
    );
  }

  async cancel(id: string): Promise<Broadcast> {
    return this.post<Broadcast>(
      this.createURL(`/admin/broadcasts/${id}/cancel`, new URLSearchParams()),
      {},
    );
  }
}

const controller = new AdminBroadcastsController();

export const getBroadcastsList = controller.getList.bind(controller);
export const getBroadcastById = controller.getById.bind(controller);
export const getBroadcastRecipients = controller.getRecipients.bind(controller);
export const previewBroadcastAudience =
  controller.previewAudience.bind(controller);
export const createBroadcast = controller.create.bind(controller);
export const updateBroadcast = controller.update.bind(controller);
export const deleteBroadcast = controller.remove.bind(controller);
export const sendBroadcast = controller.send.bind(controller);
export const cancelBroadcast = controller.cancel.bind(controller);
