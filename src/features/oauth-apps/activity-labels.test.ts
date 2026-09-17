import { describe, expect, it } from "vitest";
import type { OAuthAppRequest } from "#/lib/api/oauth-apps-controller";
import {
  callLabel,
  describeRequest,
  formatDuration,
  outcomeLabel,
} from "./activity-labels";

const item = (overrides: Partial<OAuthAppRequest>): OAuthAppRequest => ({
  id: "r1",
  kind: "TOKEN",
  statusCode: 200,
  outcome: "ok",
  durationMs: 12,
  request: {},
  response: {},
  createdAt: "2026-09-17T08:00:00.000Z",
  ...overrides,
});

describe("activity labels", () => {
  it("names calls and outcomes plainly", () => {
    expect(callLabel("IDENTITY_CHECK_CREATE")).toBe("Identity check requested");
    expect(outcomeLabel("ok")).toBe("OK");
    expect(outcomeLabel("invalid_client")).toMatch(/Wrong app ID/);
    expect(outcomeLabel("something_new")).toBe("Refused");
  });

  it("describes an identity check request", () => {
    expect(
      describeRequest(
        item({
          kind: "IDENTITY_CHECK_CREATE",
          statusCode: 202,
          request: {
            phone: "••86",
            fields_sent: ["first_name", "last_name", "country_code"],
          },
          response: { check_id: "c1", status: "pending_consent" },
        }),
      ),
    ).toBe(
      "Phone ••86 · with first name, last name, country · → waiting for the person",
    );
  });

  it("describes a read result", () => {
    expect(
      describeRequest(
        item({
          kind: "IDENTITY_CHECK_READ",
          response: { status: "completed", recommendation: "accept", score: 91 },
        }),
      ),
    ).toBe("completed · suggestion: accept · score 91/100");
  });

  it("leads with the reason for a refusal", () => {
    expect(
      describeRequest(
        item({
          outcome: "invalid_client",
          statusCode: 401,
          response: {
            error: "invalid_client",
            description: "Client authentication failed.",
          },
        }),
      ),
    ).toBe("Client authentication failed.");
  });

  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45 ms");
    expect(formatDuration(1234)).toBe("1.2 s");
  });
});
