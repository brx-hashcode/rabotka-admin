import { describe, expect, it } from "vitest";

import { eventSchema } from "#/features/calendar/schemas";
import {
  describeRecurrence,
  fromRecurrence,
  toRecurrenceParams,
} from "#/features/calendar/utils/recurrence";

describe("describeRecurrence", () => {
  it("says nothing for a one-off event", () => {
    expect(describeRecurrence(null)).toBeNull();
  });

  it("describes an open-ended series", () => {
    expect(
      describeRecurrence({ frequency: "WEEKLY", until: null, count: null }),
    ).toBe("Repeats weekly");
  });

  it("describes a series that ends on a date", () => {
    expect(
      describeRecurrence({
        frequency: "MONTHLY",
        until: "2026-12-31T12:00:00.000Z",
        count: null,
      }),
    ).toContain("until Dec 31, 2026");
  });

  it("describes a series that ends after a count", () => {
    expect(
      describeRecurrence({ frequency: "DAILY", until: null, count: 10 }),
    ).toBe("Repeats daily, 10 times");
  });
});

describe("toRecurrenceParams", () => {
  it("sends nothing at all for a non-repeating event", () => {
    // The server reads an absent field as "one-off"; `{ frequency: "NONE" }`
    // would be a validation error rather than a no-op.
    expect(
      toRecurrenceParams({ repeatFrequency: "NONE", repeatEndMode: "never" }),
    ).toBeUndefined();
  });

  it("never sends both end conditions", () => {
    // The API rejects a rule carrying both — a rule with two answers to "when
    // does this stop" has none.
    const params = toRecurrenceParams({
      repeatFrequency: "WEEKLY",
      repeatEndMode: "until",
      repeatUntil: new Date("2026-12-31T00:00:00"),
      repeatCount: 10,
    });

    expect(params?.until).toBeDefined();
    expect(params?.count).toBeUndefined();
  });

  it("keeps the last day inside the series", () => {
    const params = toRecurrenceParams({
      repeatFrequency: "WEEKLY",
      repeatEndMode: "until",
      repeatUntil: new Date("2026-12-31T00:00:00"),
    });

    // End of the chosen day, so "until 31 December" includes the 31st.
    expect(new Date(params!.until!).getHours()).toBe(23);
  });

  it("drops a stale end condition when the mode says never", () => {
    const params = toRecurrenceParams({
      repeatFrequency: "DAILY",
      repeatEndMode: "never",
      repeatUntil: new Date("2026-12-31T00:00:00"),
      repeatCount: 5,
    });

    expect(params).toEqual({ frequency: "DAILY" });
  });
});

describe("fromRecurrence", () => {
  it("round-trips a count-limited series", () => {
    const fields = fromRecurrence({
      frequency: "DAILY",
      until: null,
      count: 10,
    });

    expect(fields).toMatchObject({
      repeatFrequency: "DAILY",
      repeatEndMode: "count",
      repeatCount: 10,
    });
    expect(toRecurrenceParams(fields)).toEqual({
      frequency: "DAILY",
      count: 10,
    });
  });

  it("opens a one-off event on the non-repeating default", () => {
    expect(fromRecurrence(null)).toEqual({
      repeatFrequency: "NONE",
      repeatEndMode: "never",
    });
  });
});

describe("eventSchema repeat validation", () => {
  const base = {
    title: "Standup",
    description: "Daily standup",
    startDate: new Date("2026-09-07T09:00:00"),
    endDate: new Date("2026-09-07T09:15:00"),
    color: "blue" as const,
    channel: "EMAIL" as const,
    profileIds: [],
    userIds: [],
  };

  it("ignores the repeat fields when the event does not repeat", () => {
    const result = eventSchema.safeParse({
      ...base,
      repeatFrequency: "NONE",
      repeatEndMode: "until",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end date before the first occurrence", () => {
    const result = eventSchema.safeParse({
      ...base,
      repeatFrequency: "WEEKLY",
      repeatEndMode: "until",
      repeatUntil: new Date("2026-09-01T09:00:00"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a count end condition with no number", () => {
    const result = eventSchema.safeParse({
      ...base,
      repeatFrequency: "WEEKLY",
      repeatEndMode: "count",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an event that ends before it starts", () => {
    const result = eventSchema.safeParse({
      ...base,
      endDate: new Date("2026-09-07T08:00:00"),
      repeatFrequency: "NONE",
      repeatEndMode: "never",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed weekly series", () => {
    const result = eventSchema.safeParse({
      ...base,
      repeatFrequency: "WEEKLY",
      repeatEndMode: "until",
      repeatUntil: new Date("2026-12-31T23:59:00"),
    });
    expect(result.success).toBe(true);
  });
});
