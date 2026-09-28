import { describe, expect, it } from "vitest";
import {
  AUTOMATIC_SENDER_LABEL,
  messageSenderLabel,
} from "#/lib/message-sender-label";

describe("messageSenderLabel", () => {
  it("names the admin who wrote an outbound message", () => {
    expect(
      messageSenderLabel(
        { direction: "OUTBOUND", sentByName: "Fariol Blondeau" },
        "Leo Mayele",
      ),
    ).toBe("Fariol Blondeau");
  });

  // The bug: bot and VoVa replies were credited to whoever was signed in.
  it("labels an automatic reply as Rabotka, never as the viewer", () => {
    expect(
      messageSenderLabel({ direction: "OUTBOUND", sentByName: null }, "Leo"),
    ).toBe(AUTOMATIC_SENDER_LABEL);
    expect(
      messageSenderLabel({ direction: "OUTBOUND", sentByName: "  " }, "Leo"),
    ).toBe(AUTOMATIC_SENDER_LABEL);
  });

  it("shows the profile's name on what they sent", () => {
    expect(
      messageSenderLabel({ direction: "INBOUND", sentByName: null }, "Leo"),
    ).toBe("Leo");
  });
});
