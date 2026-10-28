import { AdminBaseController } from "./base-controller";

/** `business_plans` (rabotka-backend): a plan's prices, quotas and features. */
export type BusinessPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceFcfa: number;
  annualPriceFcfa: number;
  /** Null: unlimited. */
  unlocksPerPeriod: number | null;
  /** Null: unlimited. */
  activeOffersLimit: number | null;
  /** CVs the AI screening reads per period. Null: unlimited; 0: not included. */
  cvScreeningsPerPeriod: number | null;
  /** CVs in one screening (one upload). */
  cvBatchMax: number;
  /** Largest CV file, in MB. */
  cvFileMaxMb: number;
  /** Days a screening keeps its files and contact details. */
  cvRetentionDays: number;
  /** Questions a business may ask about one analysed CV (its chat). */
  cvChatQuestions: number;
  /** Offers the AI writes per period (« Rédiger avec l'IA »). Null: unlimited; 0: not included. */
  offerDraftsPerPeriod: number | null;
  includesPreselection: boolean;
  includesFieldAgents: boolean;
  priorityVisibility: boolean;
  isActive: boolean;
  sortOrder: number;
  /** Businesses with a period running or queued on the plan (the list only). */
  businesses?: number;
};

export type BusinessPlanInput = Omit<BusinessPlan, "id" | "businesses">;

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
export type BillingPeriod = "TRIAL" | "MONTHLY" | "ANNUAL";

export type SubscriptionPeriod = {
  id: string;
  planName: string;
  planCode: string;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod;
  startsAt: string;
  endsAt: string;
  unlocksUsed: number;
  paid: boolean;
  granted: boolean;
};

/** `GET admin/profiles/:id/business/subscription`. */
export type BusinessSubscriptionOverview = {
  entitlements: {
    plan: { id: string; code: string; name: string } | null;
    status: SubscriptionStatus | null;
    endsAt: string | null;
    unlocksRemaining: number | null;
    unlocksQuota: number | null;
    unlocksUsed: number;
    activeOffersLimit: number | null;
    activeOffers: number;
    includesPreselection: boolean;
    includesFieldAgents: boolean;
    priorityVisibility: boolean;
  };
  upcoming: SubscriptionPeriod[];
  history: SubscriptionPeriod[];
  trialUsed: boolean;
};

class BusinessPlansController extends AdminBaseController {
  list(): Promise<BusinessPlan[]> {
    return this.get("/admin/business-plans");
  }

  create(data: BusinessPlanInput): Promise<BusinessPlan> {
    return this.post("/admin/business-plans", data);
  }

  update(id: string, data: Partial<BusinessPlanInput>): Promise<BusinessPlan> {
    return this.patch(`/admin/business-plans/${encodeURIComponent(id)}`, data);
  }

  /** Hides the plan and cancels every business on it. */
  remove(id: string): Promise<{ businessesCancelled: number }> {
    return this.delete(`/admin/business-plans/${encodeURIComponent(id)}`);
  }

  subscription(profileId: string): Promise<BusinessSubscriptionOverview> {
    return this.get(`/admin/profiles/${encodeURIComponent(profileId)}/business/subscription`);
  }

  grant(
    profileId: string,
    data: { planId: string; billingPeriod: "MONTHLY" | "ANNUAL" },
  ): Promise<BusinessSubscriptionOverview> {
    return this.post(`/admin/profiles/${encodeURIComponent(profileId)}/business/subscription`, data);
  }

  cancel(profileId: string, subscriptionId: string): Promise<BusinessSubscriptionOverview> {
    return this.post(
      `/admin/profiles/${encodeURIComponent(profileId)}/business/subscription/${encodeURIComponent(subscriptionId)}/cancel`,
    );
  }
}

const controller = new BusinessPlansController();

export const listBusinessPlans = controller.list.bind(controller);
export const createBusinessPlan = controller.create.bind(controller);
export const updateBusinessPlan = controller.update.bind(controller);
export const deleteBusinessPlan = controller.remove.bind(controller);
export const getBusinessSubscription = controller.subscription.bind(controller);
export const grantBusinessSubscription = controller.grant.bind(controller);
export const cancelBusinessSubscription = controller.cancel.bind(controller);

/** « 15 000 FCFA ». */
export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}
