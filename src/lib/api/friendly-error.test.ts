import { describe, expect, it } from "vitest";
import {
  NETWORK_ERROR,
  PERMISSION_ERROR,
  RATE_LIMIT_ERROR,
  SERVER_ERROR,
  SESSION_ERROR,
  friendlyError,
} from "./friendly-error";

const apiError = (statusCode: number, message: unknown) =>
  Object.assign(new Error(typeof message === "string" ? message : "x"), {
    statusCode,
    body: { message },
  });

const FALLBACK = "Couldn't save the job. Try again.";

describe("friendlyError", () => {
  it("keeps a plain business message", () => {
    expect(
      friendlyError(
        apiError(409, "This category is still used by 3 jobs."),
        FALLBACK,
      ),
    ).toBe("This category is still used by 3 jobs.");
  });

  it.each([
    ["a network failure", Object.assign(new Error("Network error occurred"), { statusCode: 0 })],
    ["a fetch TypeError", new TypeError("Failed to fetch")],
  ])("explains %s", (_label, error) => {
    expect(friendlyError(error, FALLBACK)).toBe(NETWORK_ERROR);
  });

  it("hides server failures", () => {
    expect(
      friendlyError(apiError(500, "Internal server error"), FALLBACK),
    ).toBe(SERVER_ERROR);
    expect(
      friendlyError(apiError(502, "This looks like a sentence"), FALLBACK),
    ).toBe(SERVER_ERROR);
  });

  it.each([
    ["validation lists", ["title must be a string", "amount should not be empty"]],
    ["Prisma internals", "Invalid `prisma.job.update()` invocation"],
    ["raw ids", "Job 3f2a1b4c-1111-2222-3333-444455556666 missing"],
    ["reason phrases", "Bad Request"],
    ["JSON", '{"error":"x"}'],
  ])("replaces %s with the fallback", (_label, message) => {
    expect(friendlyError(apiError(400, message), FALLBACK)).toBe(FALLBACK);
  });

  it("uses fixed sentences for session, permission and rate limits", () => {
    expect(friendlyError(apiError(401, "Unauthorized"), FALLBACK)).toBe(
      SESSION_ERROR,
    );
    expect(friendlyError(apiError(403, "Forbidden resource"), FALLBACK)).toBe(
      PERMISSION_ERROR,
    );
    expect(friendlyError(apiError(429, "ThrottlerException"), FALLBACK)).toBe(
      RATE_LIMIT_ERROR,
    );
  });

  it("falls back when there is nothing to show", () => {
    expect(friendlyError(undefined, FALLBACK)).toBe(FALLBACK);
    expect(friendlyError({}, FALLBACK)).toBe(FALLBACK);
  });
});
