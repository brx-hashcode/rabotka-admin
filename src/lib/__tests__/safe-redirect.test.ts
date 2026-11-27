import { describe, expect, it } from "vitest";

import { getSafeRedirectTarget } from "../safe-redirect";

const ORIGIN = "https://admin.example.test";

describe("getSafeRedirectTarget", () => {
  it("keeps a path on this site", () => {
    expect(getSafeRedirectTarget("/profiles/1?tab=kyc#docs", ORIGIN)).toBe("/profiles/1?tab=kyc#docs");
    expect(getSafeRedirectTarget(`${ORIGIN}/settings`, ORIGIN)).toBe("/settings");
  });

  it("refuses another host, however it is written", () => {
    for (const raw of [
      "https://evil.example/",
      "//evil.example",
      "/.//evil.example",
      "/a/..//evil.example",
      "/%2e//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
    ]) {
      expect(getSafeRedirectTarget(raw, ORIGIN)).toBeNull();
    }
  });

  it("refuses nothing given", () => {
    expect(getSafeRedirectTarget("", ORIGIN)).toBeNull();
  });
});
