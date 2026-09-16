import { describe, expect, it } from "vitest";
import { actionLabel, recordTypeLabel } from "./log-labels";

describe("actionLabel", () => {
  it.each([
    ["KYC_APPROVED", "Identity check (KYC) approved"],
    ["OAUTH_APP_SECRET_ROTATED", "Partner app password renewed"],
    ["IDENTITY_CHECK_CREATED", "Identity check created"],
    ["PROFILE_SUSPENDED", "Profile suspended"],
    [null, "—"],
  ])("%s → %s", (code, label) => {
    expect(actionLabel(code)).toBe(label);
  });
});

describe("recordTypeLabel", () => {
  it.each([
    ["JobOffer", "Job"],
    ["OAuthApp", "Partner app"],
    ["WhatsappMessage", "Whatsapp message"],
    [null, "—"],
  ])("%s → %s", (type, label) => {
    expect(recordTypeLabel(type)).toBe(label);
  });
});
