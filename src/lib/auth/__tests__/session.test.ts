import { describe, expect, it } from "vitest";
import {
  authEstablishmentPathsForTest,
  httpStatusOf,
  is401,
  isAuthEstablishmentPath,
  isSessionExpiry,
  normalizeApiPath,
} from "#/lib/auth/session";

/**
 * The invariant: a 401 logs the admin out — EXCEPT from the endpoints where a
 * 401 means "you typed the wrong code".
 *
 * Both halves matter and fail in opposite directions. Miss a real expiry and a
 * dead session keeps rendering stale privileged data. Fire on a login attempt
 * and an admin gets booted for mistyping their OTP.
 *
 * Only the pure predicates are covered here. `expireSession` calls
 * `location.assign`, which needs jsdom, and no test in this repo uses jsdom —
 * keeping `session.ts` free of app imports is what makes 100% of the *decision*
 * logic reachable without it.
 */

describe("httpStatusOf / is401", () => {
  it("reads the status off a shaped error object", () => {
    // A literal, not `new ApiError(...)`: the class is not exported from
    // mvc-front-sdk, so `instanceof` is impossible and duck-typing IS the
    // contract. See the doc-comment on httpStatusOf.
    expect(httpStatusOf({ name: "ApiError", statusCode: 401 })).toBe(401);
    expect(is401({ name: "ApiError", message: "Unauthorized", statusCode: 401 })).toBe(true);
  });

  it("does not treat a network failure as a 401", () => {
    // statusCode 0 is what the SDK throws when fetch itself fails. This is the
    // regression that matters most: it is the difference between "offline for
    // three seconds" and "logged out".
    expect(is401({ name: "ApiError", statusCode: 0 })).toBe(false);
  });

  it("does not treat 403 as a 401", () => {
    // RolesGuard returns 403 when an authenticated MODERATOR opens an ADMIN
    // page. They are signed in; logging them out would be wrong.
    expect(is401({ name: "ApiError", statusCode: 403 })).toBe(false);
  });

  it("returns false for an error whose status was flattened away", () => {
    // BaseController.handleError rethrows `new Error(message)`, dropping
    // statusCode. auth-controller.ts is its only caller, so getMe's 401 arrives
    // in this shape — which is exactly why _authenticated.tsx pivots on
    // isExpiring() and not on is401(error).
    expect(is401(new Error("Unauthorized"))).toBe(false);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "401"],
    ["a number", 401],
    ["the wrong key", { status: 401 }],
    ["a stringified status", { statusCode: "401" }],
  ])("returns false for %s", (_label, value) => {
    expect(is401(value)).toBe(false);
    expect(httpStatusOf(value)).toBeNull();
  });
});

describe("normalizeApiPath", () => {
  it.each([
    // Controller flavour — paths arrive without the API prefix.
    ["/auth/admin/verify-otp", "/auth/admin/verify-otp"],
    // Raw-fetch flavour — these carry it.
    ["/api/v1/auth/admin/verify-otp", "/auth/admin/verify-otp"],
    // Absolute, with query and hash.
    ["http://localhost:3300/api/v1/auth/admin/verify-otp?x=1#f", "/auth/admin/verify-otp"],
    // Trailing slash.
    ["/api/v1/admin/wallet/transactions/", "/admin/wallet/transactions"],
    // Query strings are dropped, not searched.
    ["/admin/profiles?page=2", "/admin/profiles"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeApiPath(input)).toBe(expected);
  });

  it("does not let a query value smuggle a path in", () => {
    // The case that justifies parsing over String.includes: this is an ordinary
    // admin request and must stay one, however its search param reads.
    expect(normalizeApiPath("/admin/profiles?search=/auth/admin/verify-otp")).toBe(
      "/admin/profiles",
    );
  });

  it("resolves .. before matching", () => {
    expect(normalizeApiPath("/auth/admin/verify-otp/../me")).toBe("/auth/admin/me");
  });

  it.each([["empty", ""], ["blank", "   "], ["garbage", "::::"]])(
    "never throws on %s input",
    (_label, input) => {
      expect(() => normalizeApiPath(input)).not.toThrow();
    },
  );
});

describe("isAuthEstablishmentPath", () => {
  it.each([
    "/auth/admin/send-otp",
    "/auth/admin/resend-otp",
    "/auth/admin/verify-otp",
    "/auth/admin/totp/login",
    "/auth/admin/totp/enable",
    "/auth/admin/totp/disable",
    "/auth/admin/qr/init",
    "/auth/admin/qr/consume",
    "/auth/admin/qr/confirm",
    "/auth/admin/phone/pair/verify",
  ])("allows %s in both prefix flavours", (path) => {
    expect(isAuthEstablishmentPath(path)).toBe(true);
    expect(isAuthEstablishmentPath(`/api/v1${path}`)).toBe(true);
  });

  it("allows a parameterised qr poll", () => {
    expect(isAuthEstablishmentPath("/auth/admin/qr/poll/abc-123")).toBe(true);
    expect(isAuthEstablishmentPath("/api/v1/auth/admin/qr/poll/abc-123")).toBe(true);
  });

  it.each([
    ["/auth/admin/me", "the original gate — 401 here is expiry"],
    ["/auth/admin/logout", "401 here is expiry"],
    ["/auth/admin/totp/setup", "guarded, no user-supplied code — expiry"],
    ["/auth/admin/phone/pair", "guarded — expiry"],
    ["/auth/admin/phone/pair/generate", "guarded — expiry"],
    ["/admin/profiles", "an ordinary admin request"],
    ["/auth/admin/qr/poll", "bare, without a session id, is not a route"],
    ["/auth/admin/verify-otpX", "near-miss must not match"],
    ["/auth/admin/verify-otp/../me", "resolves to /auth/admin/me"],
  ])("denies %s (%s)", (path) => {
    expect(isAuthEstablishmentPath(path)).toBe(false);
  });

  it("holds no wildcards", () => {
    // Matching is exact on purpose: a /auth/admin/phone/pair* wildcard would
    // swallow two endpoints whose 401 is a genuine expiry.
    for (const path of authEstablishmentPathsForTest.exact) {
      expect(path).not.toContain("*");
      expect(path.endsWith("/")).toBe(false);
    }
    for (const prefix of authEstablishmentPathsForTest.prefixes) {
      expect(prefix).not.toContain("*");
      expect(prefix.endsWith("/")).toBe(true);
    }
  });
});

describe("isSessionExpiry", () => {
  const ordinary = "/admin/profiles";
  const login = "/auth/admin/verify-otp";

  const cases: [unknown, string, boolean, string][] = [
    // error,                           path,      expected, why
    [{ statusCode: 401 }, ordinary, true, "expired session on a normal request"],
    [{ statusCode: 401 }, login, false, "a mistyped OTP is not an expiry"],
    [{ statusCode: 403 }, ordinary, false, "RolesGuard, still authenticated"],
    [{ statusCode: 403 }, login, false, "not a 401 at all"],
    [{ statusCode: 0 }, ordinary, false, "network failure, not an expiry"],
    [{ statusCode: 0 }, login, false, "network failure, not an expiry"],
    [new Error("Unauthorized"), ordinary, false, "status already flattened away"],
    [new Error("Unauthorized"), login, false, "status already flattened away"],
  ];

  it.each(cases)("%o on %s -> %s (%s)", (error, path, expected) => {
    expect(isSessionExpiry(error, path)).toBe(expected);
  });

  it("would have caught the OTP trap", () => {
    // The bug this whole module is shaped around: a wrong OTP returns 401
    // (auth.service.ts:590). A naive interceptor logs the admin out mid-login.
    const wrongOtp = { name: "ApiError", statusCode: 401, message: "Code de vérification invalide ou expiré" };
    expect(is401(wrongOtp)).toBe(true);
    expect(isSessionExpiry(wrongOtp, "/auth/admin/verify-otp")).toBe(false);
  });
});
