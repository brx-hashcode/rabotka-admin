import { describe, expect, it } from "vitest";

import type { BusinessPlan } from "#/lib/api/business-plans-controller";
import { plansForBusiness } from "#/pages/profile-detail/components/business-subscription-card";
import { customPlanCode } from "../components/plan-dialog";
import { trialOffer } from "../trial-offer";

const plan = (over: Partial<BusinessPlan>): BusinessPlan =>
  ({ id: "p", code: "basic", name: "Basic", isActive: true, businessId: null, ...over }) as BusinessPlan;

const config = (days: string, code: string) => [
  { key: "business.trial_days", value: days },
  { key: "business.trial_plan_code", value: code },
];

describe("trialOffer", () => {
  it("names the configured plan and its days", () => {
    expect(trialOffer(config("14", "basic"), [plan({})])).toEqual({ days: 14, planName: "Basic" });
  });

  it("is null when the trial is off or its plan can't be one", () => {
    expect(trialOffer(config("0", "basic"), [plan({})])).toBeNull();
    expect(trialOffer(config("14", ""), [plan({})])).toBeNull();
    expect(trialOffer(config("14", "basic"), [plan({ isActive: false })])).toBeNull();
    expect(trialOffer(config("14", "basic"), [plan({ businessId: "b1" })])).toBeNull();
    expect(trialOffer(config("14", "pro"), [plan({})])).toBeNull();
  });
});

describe("plansForBusiness", () => {
  it("keeps the active catalog and this business's own custom plans", () => {
    const plans = [
      plan({ id: "cat" }),
      plan({ id: "off", isActive: false }),
      plan({ id: "mine", businessId: "b1" }),
      plan({ id: "theirs", businessId: "b2" }),
    ];
    expect(plansForBusiness(plans, "b1").map((p) => p.id)).toEqual(["cat", "mine"]);
  });
});

describe("customPlanCode", () => {
  it("adds the business to the code, as a valid code", () => {
    expect(customPlanCode("pro", "Café du Port & Fils")).toBe("pro-cafe-du-port-fils");
    expect(customPlanCode("pro", "A".repeat(60))).toMatch(/^[a-z0-9-]{2,40}$/);
  });
});
