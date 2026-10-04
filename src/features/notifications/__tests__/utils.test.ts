import { describe, expect, it } from "vitest";
import {
  getNotificationHref,
  NOTIFICATION_ENTITY_LABELS,
} from "#/features/notifications/utils";

describe("getNotificationHref", () => {
  // A held-message alert has to open the thread itself: that is where the
  // admin reads it and, if needed, closes the conversation.
  it("opens the conversation for a held-message alert", () => {
    expect(getNotificationHref("conversation", "c-1")).toBe(
      "/conversations/c-1",
    );
    expect(NOTIFICATION_ENTITY_LABELS.conversation).toBe("Conversation");
  });

  // A support request is filed against the profile, whose Messages panel and
  // VoVa switch are how an admin takes over the WhatsApp thread.
  it("opens the profile for a support request", () => {
    expect(getNotificationHref("profile", "p-1")).toBe("/profiles/p-1");
  });

  it("opens the application for a placement, and the payout queue for a withdrawal", () => {
    expect(getNotificationHref("agent-placement", "app-1")).toBe(
      "/applications/app-1",
    );
    expect(getNotificationHref("agent", "a-1")).toBe("/agents/a-1");
    expect(getNotificationHref("agent-withdrawal", "w-1")).toBe(
      "/agent-payouts",
    );
    expect(NOTIFICATION_ENTITY_LABELS["agent-withdrawal"]).toBe("Agent payout");
  });

  it("gives no link for an entity it does not know", () => {
    expect(getNotificationHref("something-new", "x")).toBeNull();
  });
});
