import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { describeRange, matchPreset, presetRange } from "../range-presets";

describe("range presets", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds a window ending today", () => {
    expect(presetRange(7)).toEqual({ from: "2026-09-23", to: "2026-09-30" });
  });

  it("recognises a preset from its dates", () => {
    expect(matchPreset("2026-09-23", "2026-09-30")?.days).toBe(7);
    expect(matchPreset("2026-08-31", "2026-09-30")?.days).toBe(30);
  });

  it("matches nothing when the window does not end today", () => {
    expect(matchPreset("2026-09-22", "2026-09-29")).toBeNull();
  });

  it("matches nothing for a half-open or off-preset window", () => {
    expect(matchPreset("2026-09-23", "")).toBeNull();
    expect(matchPreset("2026-09-20", "2026-09-30")).toBeNull();
  });

  it("names a preset rather than spelling out its dates", () => {
    expect(describeRange("2026-09-23", "2026-09-30", "all time")).toBe(
      "last 7 days",
    );
  });

  it("uses the caller's label when there is no range", () => {
    expect(describeRange("", "", "all time")).toBe("all time");
    expect(describeRange("", "", "last 30 days")).toBe("last 30 days");
  });

  it("spells out a custom range, filling the open end", () => {
    expect(describeRange("2026-09-01", "2026-09-15", "all time")).toBe(
      "2026-09-01 → 2026-09-15",
    );
    expect(describeRange("2026-09-01", "", "all time")).toBe(
      "2026-09-01 → today",
    );
    expect(describeRange("", "2026-09-15", "all time")).toBe(
      "start → 2026-09-15",
    );
  });
});
