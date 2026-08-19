import { describe, it, expect } from "vitest";
import { canEditArea, canViewRoute } from "#/lib/role-access";

/**
 * SUPER_ADMIN is the top of the ladder and must reach every screen. The sidebar
 * decides visibility from its own arrays, but `canViewRoute` is what the router
 * enforces — so it is the one that must never say no.
 */
const EVERY_ROUTE = [
  "/",
  "/profiles",
  "/profiles/abc",
  "/jobs",
  "/job-categories",
  "/applications",
  "/chat",
  "/penalties",
  "/network",
  "/team",
  "/wallet",
  "/payment-requests",
  "/claim",
  "/feedback",
  "/events",
  "/whatsapp",
  "/logs",
  "/documents",
  "/ads-bundles",
  "/advertisements",
  "/settings",
  "/help",
  "/notifications",
  "/profile",
];

describe("SUPER_ADMIN reach", () => {
  it.each(EVERY_ROUTE)("can open %s", (route) => {
    expect(canViewRoute("SUPER_ADMIN", route)).toBe(true);
  });

  it.each(EVERY_ROUTE)("can act on %s", (route) => {
    expect(canEditArea("SUPER_ADMIN", route)).toBe(true);
  });

  it("is the only role that can open settings", () => {
    for (const role of ["FINANCE", "SUPPORT"] as const) {
      expect(canViewRoute(role, "/settings")).toBe(false);
      expect(canViewRoute(role, "/team")).toBe(false);
    }
  });
});
