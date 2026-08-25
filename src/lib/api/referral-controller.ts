import { AdminBaseController } from "./base-controller";
import type { ReferralSource, ReferralStatus } from "./profiles-controller";

export type AdminReferralParty = {
  profileId: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileType: string;
};

export type AdminReferralItem = {
  id: string;
  createdAt: string;
  codeUsed: string;
  source: ReferralSource;
  status: ReferralStatus;
  rewardedAt: string | null;
  referrerAmount: number | null;
  refereeAmount: number | null;
  /** Why nothing was paid, when the status says nothing was. */
  settlementNote: string | null;
  qualifyingPaymentRequestId: string | null;
  qualifyingAmount: number | null;
  qualifyingType: string | null;
  referrer: AdminReferralParty;
  referee: AdminReferralParty;
};

export type AdminReferralStats = {
  total: number;
  pending: number;
  onHold: number;
  rewarded: number;
  capped: number;
  forfeited: number;
  totalPaidOutFcfa: number;
};

export type ListReferralsParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string[];
  /** Restricts to one profile in either role — feeds the profile detail pane. */
  profileId?: string;
  created_from?: string;
  created_to?: string;
};

type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export class AdminReferralController extends AdminBaseController {
  async getList(
    params: ListReferralsParams = {},
  ): Promise<Paginated<AdminReferralItem>> {
    const searchParams: Record<string, unknown> = {};
    if (params.page != null) searchParams.page = params.page;
    if (params.limit != null) searchParams.limit = params.limit;
    if (params.q) searchParams.q = params.q;
    if (params.status?.length) searchParams.status = params.status;
    if (params.profileId) searchParams.profileId = params.profileId;
    if (params.created_from) searchParams.created_from = params.created_from;
    if (params.created_to) searchParams.created_to = params.created_to;

    const query = this.buildSearchParams(searchParams);
    const url = this.createURL("/admin/referrals", query);
    return this.get<Paginated<AdminReferralItem>>(url);
  }

  async getStats(): Promise<AdminReferralStats> {
    const url = this.createURL("/admin/referrals/stats", new URLSearchParams());
    return this.get<AdminReferralStats>(url);
  }
}

const controller = new AdminReferralController();
export const getReferrals = controller.getList.bind(controller);
export const getReferralStats = controller.getStats.bind(controller);
