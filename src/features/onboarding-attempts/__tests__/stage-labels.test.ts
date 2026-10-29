import { describe, expect, it } from "vitest";
import { stoppedAt, timeAgo, whatsAppLink, contactOf, emailFollowUpLink, initials } from "../stage-labels";

describe("stoppedAt", () => {
  it("turns reached-or-further counts into where people stopped", () => {
    const stopped = stoppedAt([
      { stage: "CODE_SENT", count: 10 },
      { stage: "PHONE_VERIFIED", count: 6 },
      { stage: "DOCUMENTS", count: 5 },
      { stage: "CONFIRMATION", count: 3 },
      { stage: "COMPLETED", count: 2 },
    ]);
    expect(stopped).toEqual({
      CODE_SENT: 4,
      PHONE_VERIFIED: 1,
      DOCUMENTS: 2,
      CONFIRMATION: 1,
      COMPLETED: 2,
    });
  });
});

describe("timeAgo", () => {
  const now = Date.UTC(2026, 9, 20, 12, 0);
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("speaks in minutes, hours, then days", () => {
    expect(timeAgo(ago(20_000), now)).toBe("à l'instant");
    expect(timeAgo(ago(5 * 60_000), now)).toBe("il y a 5 min");
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe("il y a 3 h");
    expect(timeAgo(ago(2 * 86_400_000), now)).toBe("il y a 2 j");
  });
});

it("builds a wa.me link from any phone format", () => {
  expect(whatsAppLink("+242 06 991 76 12")).toBe("https://wa.me/242069917612");
});

describe("business sign-ups (email, no phone)", () => {
  it("reaches them by email", () => {
    expect(contactOf({ phone: null, email: "zua@food.cg" })).toBe("zua@food.cg");
    expect(contactOf({ phone: "+242 06 000 0012", email: null })).toBe("+242 06 000 0012");
  });

  it("draws initials from the email when there is no name", () => {
    expect(initials(null, null, "zua@food.cg")).toBe("Z");
    expect(initials(null, null, "+242 06 000 0012")).toBe("12");
    expect(initials("Seba", "Gedeon", "zua@food.cg")).toBe("SG");
  });

  it("writes the follow-up as an email", () => {
    const link = emailFollowUpLink("zua@food.cg", "Jebb");
    expect(link.startsWith("mailto:zua@food.cg?subject=")).toBe(true);
    expect(decodeURIComponent(link)).toContain("Bonjour Jebb");
  });
});
