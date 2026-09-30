import { describe, expect, it } from "vitest";

import { parseSchedule, toLocalInputValue } from "../broadcast-schedule";

describe("broadcast schedule", () => {
  const now = new Date(2026, 8, 30, 10, 0, 0);

  it("reads a datetime-local value on the admin's own clock", () => {
    const at = parseSchedule("2026-10-02T08:00", now);
    expect(at).toEqual(new Date(2026, 9, 2, 8, 0, 0));
  });

  it("refuses a time that has already passed", () => {
    expect(parseSchedule("2026-09-30T09:59", now)).toBeNull();
    expect(parseSchedule("2026-09-30T10:00", now)).toBeNull();
  });

  it("refuses an empty or unparseable value", () => {
    expect(parseSchedule("", now)).toBeNull();
    expect(parseSchedule("soon", now)).toBeNull();
  });

  it("round-trips through the input format", () => {
    const at = new Date(2026, 9, 2, 8, 5, 0);
    expect(toLocalInputValue(at)).toBe("2026-10-02T08:05");
    expect(parseSchedule(toLocalInputValue(at), now)).toEqual(at);
  });
});
