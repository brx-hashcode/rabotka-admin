import type { BusinessPlan } from "#/lib/api/business-plans-controller";

/** What approving a business may start: the trial, as Settings → Business plans configures it. */
export type TrialOffer = { days: number; planName: string };

/**
 * The trial a new business would get, from the `business.trial_*` settings
 * and the plan list. Null: no trial is configured (0 days, no plan, or a plan
 * that can't be one: inactive, or a custom plan). As the backend's
 * `startTrial`, which refuses the same cases.
 */
export function trialOffer(configs: { key: string; value: string }[], plans: BusinessPlan[]): TrialOffer | null {
  const value = (key: string) => configs.find((c) => c.key === key)?.value?.trim() ?? "";
  const days = Math.floor(Number(value("business.trial_days")) || 0);
  const code = value("business.trial_plan_code");
  if (days <= 0 || !code) return null;
  const plan = plans.find((p) => p.code === code);
  if (!plan || !plan.isActive || plan.businessId) return null;
  return { days, planName: plan.name };
}
