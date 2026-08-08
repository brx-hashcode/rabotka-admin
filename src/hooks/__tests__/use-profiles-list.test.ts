import { describe, expect, it } from "vitest";
import { toWhatsappConnected } from "../use-profiles-list";

describe("toWhatsappConnected", () => {
  it("maps a single selection to the boolean the API expects", () => {
    expect(toWhatsappConnected(["true"])).toBe(true);
    expect(toWhatsappConnected(["false"])).toBe(false);
  });

  it("does not filter when nothing is selected", () => {
    expect(toWhatsappConnected([])).toBeUndefined();
  });

  it("does not filter when both options are selected", () => {
    // Both boxes ticked means "every profile", not "the first one I ticked".
    expect(toWhatsappConnected(["true", "false"])).toBeUndefined();
    expect(toWhatsappConnected(["false", "true"])).toBeUndefined();
  });

  it("ignores values that are not a boolean spelling", () => {
    expect(toWhatsappConnected(["maybe"])).toBeUndefined();
  });
});
