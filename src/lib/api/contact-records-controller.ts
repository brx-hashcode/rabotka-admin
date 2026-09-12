import { AdminBaseController } from "./base-controller";

/** How an employer came to hold a worker's contact details. */
export type ContactRecordOrigin = "MISSION" | "DIRECT";

export type AdminContactRecordListItem = {
  id: string;
  origin: ContactRecordOrigin;
  /** What the employer paid, in FCFA. */
  amount: number;
  unlockedAt: string;
  employerId: string;
  employerName: string;
  employerPhone: string;
  /** Null for the many profiles with no email — phone is the real identity. */
  employerEmail: string | null;
  employerAvatarUrl: string | null;
  workerId: string;
  workerName: string;
  workerPhone: string;
  workerEmail: string | null;
  workerAvatarUrl: string | null;
  /** Null for DIRECT — there is no job behind it. */
  jobOfferId: string | null;
  jobTitle: string | null;
  createdAt: string;
};

export type AdminContactRecordsResponse = {
  data: AdminContactRecordListItem[];
  total: number;
  page: number;
  limit: number;
};

type ContactRecordParty = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  profileType: string;
};

export type AdminContactRecordDetail = {
  id: string;
  origin: ContactRecordOrigin;
  amount: number;
  unlockedAt: string;
  createdAt: string;
  employer: ContactRecordParty;
  worker: ContactRecordParty;
  jobOffer: {
    id: string;
    title: string;
    status: string;
    quantity: number;
    scheduledAt: string | null;
  } | null;
  applicationId: string | null;
  contactUnlockAttemptId: string | null;
  paymentId: string | null;
  paymentRequestId: string | null;
  /**
   * The two-sided payment state a MISSION unlock went through. Null for a
   * DIRECT one, which has no such state — the employer simply paid.
   */
  unlockAttempt: {
    id: string;
    status: string;
    employerPaid: boolean;
    workerPaid: boolean;
    employerPaidAt: string | null;
    workerPaidAt: string | null;
    employerAmount: number;
    workerAmount: number;
    expiresAt: string;
    unlockedAt: string | null;
  } | null;
};

/** Both directions for one profile, as the profile page's contacts tab shows. */
export type AdminProfileContactsResponse = {
  contacted: AdminProfileContactItem[];
  contactedBy: AdminProfileContactItem[];
  totals: { contacted: number; contactedBy: number; spent: number };
};

export type AdminProfileContactItem = {
  id: string;
  origin: ContactRecordOrigin;
  amount: number;
  unlockedAt: string;
  profile: ContactRecordParty;
  jobOfferId: string | null;
  jobTitle: string | null;
};

export type AdminContactRecordsListParams = {
  page?: number;
  limit?: number;
  q?: string;
  origin?: string[];
  employer_id?: string;
  worker_id?: string;
  job_offer_id?: string;
  since?: string;
  until?: string;
};

export class AdminContactRecordsController extends AdminBaseController {
  async getList(
    params: AdminContactRecordsListParams,
  ): Promise<AdminContactRecordsResponse> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.origin?.length) searchParams.origin = params.origin;
    if (params.employer_id) searchParams.employer_id = params.employer_id;
    if (params.worker_id) searchParams.worker_id = params.worker_id;
    if (params.job_offer_id) searchParams.job_offer_id = params.job_offer_id;
    if (params.since) searchParams.since = params.since;
    if (params.until) searchParams.until = params.until;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/contact-records", query);
    return this.get<AdminContactRecordsResponse>(url);
  }

  async getById(id: string): Promise<AdminContactRecordDetail> {
    const url = this.createURL(
      `/admin/contact-records/${id}`,
      new URLSearchParams(),
    );
    return this.get<AdminContactRecordDetail>(url);
  }

  async getForProfile(
    profileId: string,
  ): Promise<AdminProfileContactsResponse> {
    const url = this.createURL(
      `/admin/profiles/${profileId}/contacts`,
      new URLSearchParams(),
    );
    return this.get<AdminProfileContactsResponse>(url);
  }
}

const controller = new AdminContactRecordsController();
export const getContactRecordsList = controller.getList.bind(controller);
export const getContactRecordById = controller.getById.bind(controller);
export const getProfileContacts = controller.getForProfile.bind(controller);
