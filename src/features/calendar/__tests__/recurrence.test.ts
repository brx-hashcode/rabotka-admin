import { describe, expect, it } from "vitest";

import { eventSchema } from "#/features/calendar/schemas";
import {
  msToDuration,
  resolveEventEnd,
} from "#/features/calendar/utils/event-window";
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
    durationValue: 15,
    durationUnit: "minutes" as const,
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

  it("rejects a duration of zero", () => {
    const result = eventSchema.safeParse({
      ...base,
      durationValue: 0,
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

describe("msToDuration", () => {
  const MINUTE = 60_000;

  it("picks the largest unit that divides the span evenly", () => {
    // What the form shows when an existing event is opened: a stored 3-day
    // event has to come back as "3 days", not "4320 minutes".
    expect(msToDuration(3 * 24 * 60 * MINUTE)).toEqual({
      value: 3,
      unit: "days",
    });
    expect(msToDuration(2 * 60 * MINUTE)).toEqual({ value: 2, unit: "hours" });
    expect(msToDuration(90 * MINUTE)).toEqual({ value: 90, unit: "minutes" });
  });

  it("never yields a zero-length event", () => {
    // A row whose end equals its start would otherwise open the form on a
    // duration the schema rejects.
    expect(msToDuration(0)).toEqual({ value: 1, unit: "minutes" });
  });

  it("round-trips through the end date the API stores", () => {
    const start = new Date("2026-09-07T13:00:00");
    const end = new Date("2026-09-10T13:00:00");

    expect(resolveEventEnd(start, msToDuration(end.getTime() - start.getTime()))).toEqual(
      end,
    );
  });
});

describe("eventSchema — a duration instead of an end date", () => {
  const base = {
    title: "Lunch",
    description: "Lunch",
    startDate: new Date("2026-09-07T13:00:00"),
    color: "blue" as const,
    channel: "EMAIL" as const,
    profileIds: [],
    userIds: [],
  };

  it("falls back to the default length when nothing is entered", () => {
    // There is no field that can say "this occurrence never ends" any more —
    // that idea only exists on the repeat, as "Ends: Never".
    const result = eventSchema.safeParse({
      ...base,
      repeatFrequency: "DAILY",
      repeatEndMode: "never",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      durationValue: 30,
      durationUnit: "minutes",
    });
  });

  const parse = (
    durationValue: number,
    durationUnit: string,
    repeatFrequency: string,
  ) =>
    eventSchema.safeParse({
      ...base,
      durationValue,
      durationUnit,
      repeatFrequency,
      repeatEndMode: "never",
    });

  it("rejects a weekly event that runs for years", () => {
    // The shape behind "the calendar duplicates my event on every day": each
    // occurrence is still running when the next forty begin.
    const result = parse(365, "days", "WEEKLY");

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["durationValue"]);
    expect(result.error?.issues[0].message).toContain("shorter than a week");
  });

  it("rejects a daily event lasting exactly a day", () => {
    // Touching ends still put two occurrences on the same day, every day.
    expect(parse(24, "hours", "DAILY").success).toBe(false);
  });

  it("accepts a multi-day event that still fits its weekly interval", () => {
    expect(parse(3, "days", "WEEKLY").success).toBe(true);
  });

  it("leaves a one-off event alone however long it runs", () => {
    expect(parse(365, "days", "NONE").success).toBe(true);
  });
});
