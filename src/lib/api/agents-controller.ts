import { appConfig } from "#/config";
import { AdminBaseController } from "./base-controller";
import type { AdminLogEntry } from "./profiles-controller";

export type AgentStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export type AgentDocumentType =
  | "IDENTITY_CARD"
  | "PASSPORT"
  | "DRIVER_LICENSE"
  | "NIU_CARD";

export type AgentKycCategory = "DOCUMENT" | "DOCUMENT_BACK" | "SELFIE";

export type AgentZone = { countryCode: string; city: string };

export type AdminAgentListItem = {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  status: AgentStatus;
  lastLoginAt: string | null;
  zones: AgentZone[];
};

export type AdminAgentKycDocument = {
  id: string;
  category: AgentKycCategory;
  /** The stream route carries no extension; this says how to render it. */
  contentKind: "image" | "pdf" | "other";
  createdAt: string;
  updatedAt: string;
};

export type AdminAgentDetail = AdminAgentListItem & {
  updatedAt: string;
  idDocumentType: AgentDocumentType;
  idDocumentNumber: string;
  statusReason: string | null;
  createdByUserId: string;
  /** The admin who created the agent; null if their account is gone. */
  createdByName: string | null;
  kycDocuments: AdminAgentKycDocument[];
};

export type AgentBalance = {
  pending: number;
  available: number;
  locked: number;
  paidOut: number;
  totalEarned: number;
};

export type AgentLedgerEntry = {
  id: string;
  createdAt: string;
  kind:
    | "COMMISSION_EARNED"
    | "COMMISSION_RELEASED"
    | "COMMISSION_CANCELLED"
    | "WITHDRAWAL_REQUESTED"
    | "WITHDRAWAL_PAID"
    | "WITHDRAWAL_REJECTED"
    | "ADJUSTMENT";
  bucket: "PENDING" | "AVAILABLE" | "LOCKED" | "PAID_OUT";
  /** Signed FCFA: positive into the bucket, negative out of it. */
  amount: number;
  referenceType: string;
  referenceId: string | null;
  description: string | null;
};

export type AgentWallet = {
  balance: AgentBalance;
  entries: Paginated<AgentLedgerEntry>;
};

export type AgentLeadStatus =
  | "SUGGESTED"
  | "CLAIMED"
  | "INVITED"
  | "CONFIRMED"
  | "DECLINED"
  | "UNREACHABLE";

export type AgentCallOutcome =
  | "INTERESTED"
  | "NOT_AVAILABLE"
  | "NOT_INTERESTED"
  | "UNREACHABLE"
  | "WRONG_NUMBER"
  | "CALL_BACK";

export type AgentLeadWorker = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

/** One worker an agent took for one job, with every call they logged. */
export type AgentLead = {
  id: string;
  status: AgentLeadStatus;
  /** The agent still holds the claim (not lapsed). */
  mine: boolean;
  claimExpiresAt: string | null;
  invitedAt: string | null;
  inviteExpiresAt: string | null;
  inviteLapsed: boolean;
  applicationId: string | null;
  decidedAt: string | null;
  updatedAt: string;
  job: { id: string; title: string; city: string | null };
  worker: AgentLeadWorker & { city: string | null };
  calls: {
    id: string;
    outcome: AgentCallOutcome;
    note: string | null;
    at: string;
  }[];
  revealCount: number;
};

export type AgentLeads = Paginated<AgentLead> & {
  counts: Partial<Record<AgentLeadStatus, number>>;
};

export type AgentPhoneReveal = {
  id: string;
  at: string;
  ipAddress: string | null;
  worker: AgentLeadWorker;
  leadId: string;
  job: { id: string; title: string };
};

export type AgentReveals = Paginated<AgentPhoneReveal> & {
  /** Distinct workers revealed today, Brazzaville time. */
  today: number;
  dailyCap: number;
};

export type AgentCoveredZone = {
  countryCode: string;
  city: string;
  /** Non-revoked agents covering it. */
  agents: number;
};

export type AgentStats = {
  agents: { total: number; active: number; suspended: number; revoked: number };
  engagement: { signedInLast7Days: number; neverSignedIn: number };
  coverage: {
    openJobs: number;
    coveredJobs: number;
    citiesCovered: number;
    topUncovered: { countryCode: string; city: string; openJobs: number } | null;
  };
  /** Absent for roles that may not see money. */
  money?: { owed: number; available: number; paidOut: number };
};

export type AgentTimeseriesRange = 7 | 30 | 90 | 180;

export type AgentTimeseriesPoint = {
  date: string;
  created: number;
  activeAgents: number;
  earned?: number;
  paidOut?: number;
};

export type AgentTimeseries = {
  days: AgentTimeseriesRange;
  points: AgentTimeseriesPoint[];
  totals: {
    created: number;
    activeAgents: number;
    earned?: number;
    paidOut?: number;
  };
};

export type ListAgentsParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: AgentStatus;
  city?: string;
  /** ISO country codes: agents covering any city in them. */
  country?: string[];
  /** COUNTRY:City pairs: agents covering any of these cities. */
  zone?: string[];
};

/** A document already uploaded, referenced by the key the upload returned. */
export type AgentKycDocumentRef = { category: AgentKycCategory; key: string };

export type CreateAgentPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocumentType: AgentDocumentType;
  idDocumentNumber: string;
  zones: AgentZone[];
  kycDocuments: AgentKycDocumentRef[];
  avatarKey?: string;
};

export type UpdateAgentPayload = Partial<
  Pick<CreateAgentPayload, "firstName" | "lastName" | "email" | "phone" | "zones">
>;

export type AgentStatusAction = "suspend" | "reactivate" | "revoke";

type Paginated<T> = { data: T[]; total: number; page: number; limit: number };

/**
 * Where to fetch an agent identity document's bytes.
 *
 * Same contract as `kycDocumentRawUrl` for profiles: same-origin under the API,
 * so the session cookie rides along on a bare `<img src>`, and no url to the
 * object itself ever exists in the browser.
 */
export function agentKycDocumentRawUrl(agentId: string, documentId: string) {
  return `${appConfig.apiUrl}/admin/agents/${agentId}/kyc-documents/${documentId}/raw`;
}

export class AdminAgentsController extends AdminBaseController {
  async getList(
    params: ListAgentsParams = {},
  ): Promise<Paginated<AdminAgentListItem>> {
    const search: Record<string, unknown> = {};
    if (params.page != null) search.page = params.page;
    if (params.limit != null) search.limit = params.limit;
    if (params.q) search.q = params.q;
    if (params.status) search.status = params.status;
    if (params.city) search.city = params.city;
    if (params.country?.length) search.country = params.country;
    if (params.zone?.length) search.zone = params.zone;
    const url = this.createURL("/admin/agents", this.buildSearchParams(search));
    return this.get<Paginated<AdminAgentListItem>>(url);
  }

  async getZones(): Promise<AgentCoveredZone[]> {
    return this.get<AgentCoveredZone[]>(
      this.createURL("/admin/agents/zones", new URLSearchParams()),
    );
  }

  async getStats(): Promise<AgentStats> {
    return this.get<AgentStats>(
      this.createURL("/admin/agents/stats", new URLSearchParams()),
    );
  }

  async getTimeseries(days: AgentTimeseriesRange): Promise<AgentTimeseries> {
    return this.get<AgentTimeseries>(
      this.createURL(
        "/admin/agents/stats/timeseries",
        this.buildSearchParams({ days }),
      ),
    );
  }

  async getById(id: string): Promise<AdminAgentDetail> {
    return this.get<AdminAgentDetail>(
      this.createURL(`/admin/agents/${id}`, new URLSearchParams()),
    );
  }

  /** Same shape as the profile timeline, so the same component renders it. */
  async getLogs(id: string): Promise<AdminLogEntry[]> {
    return this.get<AdminLogEntry[]>(
      this.createURL(`/admin/agents/${id}/logs`, new URLSearchParams()),
    );
  }

  async getWallet(id: string, page = 1, limit = 20): Promise<AgentWallet> {
    const query = this.buildSearchParams({ page, limit });
    return this.get<AgentWallet>(
      this.createURL(`/admin/agents/${id}/wallet`, query),
    );
  }

  async getLeads(
    id: string,
    params: { status?: AgentLeadStatus; page?: number; limit?: number } = {},
  ): Promise<AgentLeads> {
    const query = this.buildSearchParams({
      status: params.status,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    });
    return this.get<AgentLeads>(
      this.createURL(`/admin/agents/${id}/leads`, query),
    );
  }

  async getReveals(id: string, page = 1, limit = 20): Promise<AgentReveals> {
    const query = this.buildSearchParams({ page, limit });
    return this.get<AgentReveals>(
      this.createURL(`/admin/agents/${id}/reveals`, query),
    );
  }

  async create(payload: CreateAgentPayload): Promise<AdminAgentDetail> {
    return this.post<AdminAgentDetail>(
      this.createURL("/admin/agents", new URLSearchParams()),
      payload,
    );
  }

  async update(
    id: string,
    payload: UpdateAgentPayload,
  ): Promise<AdminAgentDetail> {
    return this.patch<AdminAgentDetail>(
      this.createURL(`/admin/agents/${id}`, new URLSearchParams()),
      payload,
    );
  }

  async changeStatus(
    id: string,
    action: AgentStatusAction,
    reason?: string,
  ): Promise<AdminAgentDetail> {
    return this.post<AdminAgentDetail>(
      this.createURL(`/admin/agents/${id}/${action}`, new URLSearchParams()),
      reason ? { reason } : {},
    );
  }

  /** Private bucket. Returns only the key — no url to the document exists. */
  async uploadKycFile(file: File): Promise<{ key: string }> {
    const form = new FormData();
    form.append("file", file);
    return this.post<{ key: string }>(
      this.createURL("/admin/agents/uploads/kyc", new URLSearchParams()),
      form,
    );
  }

  async uploadAvatar(file: File): Promise<{ key: string; url: string }> {
    const form = new FormData();
    form.append("avatar", file);
    return this.post<{ key: string; url: string }>(
      this.createURL("/admin/agents/uploads/avatar", new URLSearchParams()),
      form,
    );
  }

  async replaceAvatar(id: string, avatarKey: string): Promise<AdminAgentDetail> {
    return this.put<AdminAgentDetail>(
      this.createURL(`/admin/agents/${id}/avatar`, new URLSearchParams()),
      { avatarKey },
    );
  }

  async replaceKycDocument(
    id: string,
    category: AgentKycCategory,
    key: string,
  ): Promise<AdminAgentDetail> {
    return this.put<AdminAgentDetail>(
      this.createURL(
        `/admin/agents/${id}/kyc-documents/${category}`,
        new URLSearchParams(),
      ),
      { key },
    );
  }
}

const controller = new AdminAgentsController();
export const getAgents = controller.getList.bind(controller);
export const getAgentStats = controller.getStats.bind(controller);
export const getAgentZones = controller.getZones.bind(controller);
export const getAgentTimeseries = controller.getTimeseries.bind(controller);
export const getAgent = controller.getById.bind(controller);
export const getAgentLogs = controller.getLogs.bind(controller);
export const getAgentWallet = controller.getWallet.bind(controller);
export const getAgentLeads = controller.getLeads.bind(controller);
export const getAgentReveals = controller.getReveals.bind(controller);
export const createAgent = controller.create.bind(controller);
export const updateAgent = controller.update.bind(controller);
export const changeAgentStatus = controller.changeStatus.bind(controller);
export const uploadAgentKycFile = controller.uploadKycFile.bind(controller);
export const uploadAgentAvatar = controller.uploadAvatar.bind(controller);
export const replaceAgentAvatar = controller.replaceAvatar.bind(controller);
export const replaceAgentKycDocument =
  controller.replaceKycDocument.bind(controller);
