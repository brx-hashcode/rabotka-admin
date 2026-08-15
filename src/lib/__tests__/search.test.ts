import { describe, expect, it } from "vitest";
import { fold, matchesSearch } from "../search";

describe("fold", () => {
  it("strips the accents French copy is full of", () => {
    expect(fold("Maraîchage")).toBe("maraichage");
    expect(fold("Secrétariat")).toBe("secretariat");
    expect(fold("Revêtement")).toBe("revetement");
    expect(fold("Découpe")).toBe("decoupe");
  });

  it("lower-cases and trims", () => {
    expect(fold("  Coiffure  ")).toBe("coiffure");
  });

  it("handles a cedilla, which is a diacritic on a consonant", () => {
    expect(fold("Maçonnerie")).toBe("maconnerie");
  });
});

describe("matchesSearch", () => {
  const DOMAIN = [
    "Agriculture & Maraîchage",
    "agriculture-maraichage",
    "Travaux agricoles, culture maraîchère, entretien de champs et récolte",
  ];

  it("finds an accented name from an unaccented query", () => {
    // The reported case: nobody reaches for the accented key while filtering.
    expect(matchesSearch("maraichage", ...DOMAIN)).toBe(true);
    expect(matchesSearch("MARAICHAGE", ...DOMAIN)).toBe(true);
  });

  it("finds an unaccented query against an accented one too", () => {
    expect(matchesSearch("maraîchage", ...DOMAIN)).toBe(true);
  });

  it("matches the description, not just the name", () => {
    expect(matchesSearch("recolte", ...DOMAIN)).toBe(true);
  });

  it("matches words out of order and across filler", () => {
    // "Boucherie & Vente de viande" — the `de` between the two typed words is
    // exactly what a single-substring `includes` trips on.
    expect(
      matchesSearch("vente viande", "Boucherie & Vente de viande"),
    ).toBe(true);
    expect(
      matchesSearch("viande vente", "Boucherie & Vente de viande"),
    ).toBe(true);
  });

  it("requires every word, not just one", () => {
    // OR would return most of the list for a two-word query.
    expect(matchesSearch("vente poisson", "Boucherie & Vente de viande")).toBe(
      false,
    );
  });

  it("matches everything on an empty or whitespace query", () => {
    expect(matchesSearch("", ...DOMAIN)).toBe(true);
    expect(matchesSearch("   ", ...DOMAIN)).toBe(true);
  });

  it("ignores nullish fields", () => {
    // `description` is nullable on a domain.
    expect(matchesSearch("barbier", "Barbier", "barbier", null)).toBe(true);
  });

  it("does not match an unrelated query", () => {
    expect(matchesSearch("plomberie", ...DOMAIN)).toBe(false);
  });
});
