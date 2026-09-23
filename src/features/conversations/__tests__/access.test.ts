import { describe, expect, it } from "vitest";

import { canReadConversationBody } from "../access";

describe("canReadConversationBody", () => {
  it.each(["MANAGER", "ADMIN", "SUPER_ADMIN"] as const)(
    "lets %s read the messages",
    (role) => {
      expect(canReadConversationBody(role)).toBe(true);
    },
  );

  it("refuses MODERATOR", () => {
    // Tier one: they get the list, the participants and the counters, which is
    // what answers most questions. Bodies are a separate, logged act.
    expect(canReadConversationBody("MODERATOR")).toBe(false);
  });

  it.each(["SUPPORT", "FINANCE"] as const)("refuses %s", (role) => {
    // By AREA, not by seniority — and this is the assertion that matters.
    // RolesGuard caps SUPPORT at MANAGER, so ranking roles would quietly let
    // them through; the server refuses them by leaving the thread controller
    // out of LATERAL_ACCESS instead. If someone ever "simplifies" this function
    // into a seniority comparison, this is what fails.
    expect(canReadConversationBody(role)).toBe(false);
  });

  it("refuses a session whose role has not loaded yet", () => {
    expect(canReadConversationBody(undefined)).toBe(false);
  });
});
