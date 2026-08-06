import { describe, it, expect } from "vitest";
import {
  flattenForTemplateVariable,
  ADMIN_MESSAGE_VAR_MAX,
} from "../whatsapp-template-text";

/**
 * These cases are copied from the backend's admin-message.spec.ts on purpose.
 *
 * The composer counts characters against the backend's limit, so the two
 * flatteners must agree — if they drift, the counter says 690/700 and the send
 * still comes back 400. Same inputs, same expected outputs, both sides.
 */
describe("flattenForTemplateVariable (mirror of the backend)", () => {
  it.each([
    ["CRLF", "a\r\nb", "a b"],
    ["tabs", "a\tb", "a b"],
    ["four spaces", "a    b", "a b"],
    ["single newline", "ligne un\nligne deux", "ligne un ligne deux"],
    [
      "paragraph break becomes a separator",
      "Bonjour,\n\nVotre dossier est validé.",
      "Bonjour, · Votre dossier est validé.",
    ],
    ["many blank lines collapse to one separator", "a\n\n\n\n\nb", "a · b"],
    ["leading blank lines", "\n\n\nBonjour", "Bonjour"],
    ["trailing blank lines", "Bonjour\n\n\n", "Bonjour"],
    ["surrounding whitespace", "  a  \n\n  b\t\tc  ", "a · b c"],
    ["zero-width characters are dropped", "a​b‍b", "abb"],
    [
      "accents and punctuation survive",
      "déjà — c’est bon ! (100%)",
      "déjà — c’est bon ! (100%)",
    ],
  ])("%s", (_label, input, expected) => {
    expect(flattenForTemplateVariable(input)).toBe(expected);
  });

  it.each([
    ["empty string", ""],
    ["spaces only", "     "],
    ["blank lines only", "  \n\n \t "],
  ])("returns empty for %s", (_label, input) => {
    expect(flattenForTemplateVariable(input)).toBe("");
  });

  it("counts a multi-paragraph message as longer than its raw length suggests", () => {
    // Each blank line becomes " · ", so the flattened count is what the limit
    // must be checked against — not textarea.value.length.
    const raw = "un\n\ndeux\n\ntrois";
    expect(flattenForTemplateVariable(raw).length).toBeGreaterThan(
      raw.replace(/\n/g, "").length,
    );
  });

  it("matches the backend's limit", () => {
    expect(ADMIN_MESSAGE_VAR_MAX).toBe(700);
  });
});
