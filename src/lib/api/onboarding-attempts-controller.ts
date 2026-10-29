import { AdminBaseController } from "./base-controller";

export const ONBOARDING_STAGES = [
  "CODE_SENT",
  "PHONE_VERIFIED",
  "DOCUMENTS",
  "CONFIRMATION",
  "COMPLETED",
] as const;
export type OnboardingStage = (typeof ONBOARDING_STAGES)[number];

/** How a sign-up began: the app's WhatsApp code, or a business's email code. */
export type OnboardingEntry = "whatsapp" | "business";

export type AdminOnboardingAttempt = {
  id: string;
  /** Null for a business sign-up, which proves an email instead. */
  phone: string | null;
  email: string | null;
  entry: OnboardingEntry;
  firstName: string | null;
  lastName: string | null;
  profileType: "WORKER" | "EMPLOYER" | null;
  stage: OnboardingStage;
  codeSends: number;
  startedAt: string;
  lastActivityAt: string;
  phoneVerifiedAt: string | null;
  completedAt: string | null;
  profileId: string | null;
  contactedAt: string | null;
  contactedBy: string | null;
  contactNote: string | null;
};

export type AdminOnboardingAttemptListParams = {
  page?: number;
  limit?: number;
  q?: string;
  stage?: OnboardingStage[];
  entry?: OnboardingEntry;
  incomplete?: boolean;
  contacted?: boolean;
  startedFrom?: string;
  startedTo?: string;
};

export type AdminOnboardingAttemptList = {
  data: AdminOnboardingAttempt[];
  total: number;
  page: number;
  limit: number;
};

export type AdminOnboardingStats = {
  started: number;
  completed: number;
  dropped: number;
  contacted: number;
  completionRate: number;
  /** Per stage, how many reached it or went further — it only narrows. */
  funnel: { stage: OnboardingStage; count: number }[];
};

class AdminOnboardingAttemptsController extends AdminBaseController {
  async listOnboardingAttempts(
    params: AdminOnboardingAttemptListParams,
  ): Promise<AdminOnboardingAttemptList> {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));
    if (params.q) search.set("q", params.q);
    for (const stage of params.stage ?? []) search.append("stage", stage);
    if (params.entry) search.set("entry", params.entry);
    if (params.incomplete) search.set("incomplete", "true");
    if (params.contacted !== undefined)
      search.set("contacted", String(params.contacted));
    if (params.startedFrom) search.set("started_from", params.startedFrom);
    if (params.startedTo) search.set("started_to", params.startedTo);
    const qs = search.toString();
    return this.get<AdminOnboardingAttemptList>(
      `/admin/onboarding-attempts${qs ? `?${qs}` : ""}`,
    );
  }

  async getOnboardingStats(params: {
    startedFrom?: string;
    startedTo?: string;
    entry?: OnboardingEntry;
  } = {}): Promise<AdminOnboardingStats> {
    const search = new URLSearchParams();
    if (params.startedFrom) search.set("started_from", params.startedFrom);
    if (params.startedTo) search.set("started_to", params.startedTo);
    if (params.entry) search.set("entry", params.entry);
    const qs = search.toString();
    return this.get<AdminOnboardingStats>(
      `/admin/onboarding-attempts/stats${qs ? `?${qs}` : ""}`,
    );
  }

  async markOnboardingContacted(
    id: string,
    note: string,
  ): Promise<AdminOnboardingAttempt> {
    return this.patch<AdminOnboardingAttempt>(
      `/admin/onboarding-attempts/${id}/contacted`,
      { note },
    );
  }
}

const controller = new AdminOnboardingAttemptsController();
export const listOnboardingAttempts =
  controller.listOnboardingAttempts.bind(controller);
export const getOnboardingStats = controller.getOnboardingStats.bind(controller);
export const markOnboardingContacted =
  controller.markOnboardingContacted.bind(controller);
