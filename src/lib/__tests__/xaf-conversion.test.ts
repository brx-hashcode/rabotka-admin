import { describe, expect, it } from "vitest";

import { formatXAF } from "../utils";

/**
 * The rendering half of the WhatsApp consumption conversion card.
 *
 * The rate itself is derived and tested on the backend
 * (common/utils/currency-conversion.util.ts). What is worth pinning HERE is the
 * assumption the card leans on: that `formatXAF` renders a franc amount the way
 * a franc amount should look. If Intl ever produced "3 806,89 FCFA" on this
 * card, nothing would fail — it would just look wrong to everyone who reads it.
 */

/** XAF per AED at the ECB's 2026-08-20 EUR/USD, as the backend derives it. */
const RATE = 655.957 / (1.1681 * 3.6725);

describe("XAF consumption conversion", () => {
  it("renders no decimal places", () => {
    // XAF is a zero-decimal currency — there is no such thing as a centime of
    // CFA franc, and Intl knows it. This is the assertion that matters.
    const rendered = formatXAF(24.9 * RATE);
    expect(rendered).not.toMatch(/[.,]\d/);
  });

  it("renders the AED 24.90 consumption figure as ~3 807 francs", () => {
    const rendered = formatXAF(24.9 * RATE);
    // Digits only, so the assertion does not depend on which space character
    // the fr-CM locale groups with.
    expect(rendered.replace(/\D/g, "")).toBe("3807");
  });

  it("names the currency rather than leaving a bare number", () => {
    // A converted figure with no unit beside a dirham figure is exactly the
    // confusion this card exists to remove.
    expect(formatXAF(1000)).toMatch(/FCFA|XAF/);
  });

  it("handles a zero total without inventing a value", () => {
    expect(formatXAF(0).replace(/\D/g, "")).toBe("0");
  });
});
