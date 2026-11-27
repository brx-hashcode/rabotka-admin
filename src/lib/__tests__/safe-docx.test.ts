import { describe, expect, it } from "vitest";

import { SAFE_DOCX_OPTIONS, makeDocxSafe, safeLinkTarget } from "../safe-docx";

/** The shape `parseAsync` returns, reduced to what the cleaning reads. */
function parsed() {
  const paragraph = {
    type: "paragraph",
    children: [
      { type: "symbol", font: "Symbol", char: "F0B7" },
      { type: "symbol", font: "Arial", char: '41;<img src=x onerror="alert(1)">' },
      { type: "hyperlink", id: "h1", children: [{ type: "text", text: "portfolio" }] },
    ],
  };
  const body = {
    type: "document",
    children: [{ type: "altChunk", id: "a1" }, paragraph],
  };
  const header = {
    type: "header",
    children: [{ type: "symbol", char: "x" }],
  };
  return {
    parts: [
      {
        body,
        rels: [
          { id: "h1", targetMode: "External", target: "javascript:alert(1)" },
          { id: "h2", targetMode: "External", target: "https://www.rabotka.work/cv" },
          { id: "a1", target: "afchunk.html" },
        ],
      },
      { rootElement: header, rels: [] },
      { notes: [{ type: "footnote", children: [{ type: "altChunk" }] }] },
    ],
  };
}

describe("makeDocxSafe", () => {
  it("drops embedded HTML and symbols that aren't a character code", () => {
    const doc = makeDocxSafe(parsed()) as ReturnType<typeof parsed>;
    const [document, header, notes] = doc.parts;
    expect(document.body?.children.map((c) => c.type)).toEqual(["paragraph"]);
    const paragraph = document.body?.children[0] as { children: { char?: string }[] };
    expect(paragraph.children.map((c) => c.char)).toEqual(["F0B7", undefined]);
    expect(header.rootElement?.children).toEqual([]);
    expect((notes.notes?.[0] as { children: unknown[] }).children).toEqual([]);
  });

  it("empties external links that aren't web, mail or phone", () => {
    const doc = makeDocxSafe(parsed()) as ReturnType<typeof parsed>;
    expect(doc.parts[0].rels?.map((r) => r.target)).toEqual([
      "",
      "https://www.rabotka.work/cv",
      "afchunk.html",
    ]);
  });

  it("tolerates what it doesn't know", () => {
    expect(() => makeDocxSafe(null)).not.toThrow();
    expect(() => makeDocxSafe({ parts: [{}] })).not.toThrow();
  });

  it("keeps the library from drawing embedded HTML", () => {
    expect(SAFE_DOCX_OPTIONS.renderAltChunks).toBe(false);
  });
});

describe("safeLinkTarget", () => {
  it("keeps web, mail and phone addresses", () => {
    expect(safeLinkTarget("https://a.example/x")).toBe("https://a.example/x");
    expect(safeLinkTarget("mailto:awa@example.com")).toBe("mailto:awa@example.com");
    expect(safeLinkTarget("tel:+242060000000")).toBe("tel:+242060000000");
  });

  it("refuses every other scheme, however it is written", () => {
    for (const target of [
      "javascript:alert(1)",
      " JaVaScRiPt:alert(1)",
      "java\tscript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "/relative/path",
      "",
      42,
    ]) {
      expect(safeLinkTarget(target)).toBe("");
    }
  });
});
