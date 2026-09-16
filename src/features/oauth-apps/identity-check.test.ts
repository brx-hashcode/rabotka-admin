import { describe, expect, it } from "vitest";
import {
  IDENTITY_CHECK_SCOPE,
  hasIdentityCheck,
  webhookUrlProblem,
  withIdentityCheck,
} from "./identity-check";

describe("withIdentityCheck", () => {
  it("adds the scope once and keeps the others", () => {
    expect(withIdentityCheck(["openid", "profile"], true)).toEqual([
      "openid",
      "profile",
      IDENTITY_CHECK_SCOPE,
    ]);
    expect(
      withIdentityCheck(["openid", IDENTITY_CHECK_SCOPE], true),
    ).toEqual(["openid", IDENTITY_CHECK_SCOPE]);
  });

  it("removes only the scope", () => {
    const off = withIdentityCheck(["openid", IDENTITY_CHECK_SCOPE], false);
    expect(off).toEqual(["openid"]);
    expect(hasIdentityCheck(off)).toBe(false);
  });
});

describe("webhookUrlProblem", () => {
  it.each([
    ["https://partner.example/hook", false],
    ["  https://partner.example/hook  ", false],
    ["http://localhost:4000/hook", true],
  ])("accepts %s (sandbox=%s)", (url, sandbox) => {
    expect(webhookUrlProblem(url, sandbox)).toBeNull();
  });

  it.each([
    ["", false],
    ["partner.example/hook", false],
    ["http://partner.example/hook", true],
    ["http://localhost:4000/hook", false],
    ["https://u:p@partner.example/hook", false],
    ["https://partner.example/hook#x", false],
  ])("refuses %s (sandbox=%s)", (url, sandbox) => {
    expect(webhookUrlProblem(url, sandbox)).toEqual(expect.any(String));
  });
});
