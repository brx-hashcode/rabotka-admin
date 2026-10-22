import { describe, expect, it } from "vitest";
import {
  initials,
  isWarmLead,
  pageRange,
  whatsAppFollowUpLink,
} from "../stage-labels";

describe("initials", () => {
  it("takes the first letter of each name", () => {
    expect(initials("Seba", "Malonga", "+242066900110")).toBe("SM");
  });

  it("falls back to the phone's last digits without a name", () => {
    expect(initials(null, null, "+242 06 690 01 10")).toBe("10");
  });
});

describe("isWarmLead", () => {
  it("flags people who reached the documents or the last step", () => {
    expect(isWarmLead("DOCUMENTS")).toBe(true);
    expect(isWarmLead("CONFIRMATION")).toBe(true);
    expect(isWarmLead("CODE_SENT")).toBe(false);
  });
});

describe("whatsAppFollowUpLink", () => {
  it("opens WhatsApp on the number with a greeting by first name", () => {
    const link = whatsAppFollowUpLink("+242 06 690 01 10", "Seba");
    expect(link.startsWith("https://wa.me/242066900110?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toContain(
      "Bonjour Seba, c'est l'équipe Rabotka",
    );
  });
});

describe("pageRange", () => {
  it.each([
    [1, 20, 47, "1–20 sur 47"],
    [3, 20, 47, "41–47 sur 47"],
    [1, 20, 0, "0 sur 0"],
  ])("page %i of %i over %i → %s", (page, size, total, label) => {
    expect(pageRange(page, size, total)).toBe(label);
  });
});
