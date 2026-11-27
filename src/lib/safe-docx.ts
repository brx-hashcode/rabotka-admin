import type { Options, WordDocument } from "docx-preview";

/**
 * A Word file from a candidate is untrusted, and docx-preview draws it
 * straight into this page. Three things in a .docx reach code that can run
 * script here:
 * - a symbol's character code, which the library writes as HTML;
 * - an external link's target, used as the link's address;
 * - an "altChunk" (embedded HTML), shown in an iframe.
 *
 * `makeDocxSafe` removes all three from the parsed document, before it is
 * drawn. The parsed tree is the only place to do it: the library creates
 * every element in this page, so cleaning the output would come too late.
 */

/** Options that keep the library from drawing embedded HTML at all. */
export const SAFE_DOCX_OPTIONS: Partial<Options> = { renderAltChunks: false };

const LINK_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/** A link target kept as it parses, or "" when its scheme isn't plain web, mail or phone. */
export function safeLinkTarget(target: unknown): string {
  if (typeof target !== "string") return "";
  try {
    const url = new URL(target.trim());
    return LINK_SCHEMES.has(url.protocol) ? url.href : "";
  } catch {
    // Relative or unparsable: a CV link always has a full address.
    return "";
  }
}

/** A symbol's character code: at most six hexadecimal digits. */
const SYMBOL_CODE = /^[0-9a-f]{1,6}$/i;

type DocxNode = {
  type?: unknown;
  char?: unknown;
  children?: unknown;
  [key: string]: unknown;
};

function isNode(value: unknown): value is DocxNode {
  return typeof value === "object" && value !== null && !ArrayBuffer.isView(value);
}

/** Whether a parsed element may be drawn: no embedded HTML, no symbol that isn't a code. */
function keep(node: DocxNode): boolean {
  if (node.type === "altChunk") return false;
  if (node.type === "symbol") return typeof node.char === "string" && SYMBOL_CODE.test(node.char);
  return true;
}

function clean(node: DocxNode, seen: WeakSet<object>) {
  if (seen.has(node)) return;
  seen.add(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") continue;
    if (Array.isArray(value)) {
      const kept = value.filter((item) => !isNode(item) || keep(item));
      if (kept.length !== value.length) node[key] = kept;
      for (const item of kept) if (isNode(item)) clean(item, seen);
    } else if (isNode(value) && typeof value.type === "string") {
      clean(value, seen);
    }
  }
}

type Relationship = { targetMode?: unknown; target?: unknown };
type Part = {
  rels?: Relationship[];
  body?: unknown;
  rootElement?: unknown;
  notes?: unknown;
  comments?: unknown;
};

/** Cleans a document from `parseAsync` in place, and returns it. */
export function makeDocxSafe(document: WordDocument): WordDocument {
  const parts = (document as { parts?: Part[] } | null)?.parts ?? [];
  const seen = new WeakSet<object>();
  for (const part of parts) {
    for (const rel of part.rels ?? []) {
      if (rel.targetMode === "External") rel.target = safeLinkTarget(rel.target);
    }
    for (const root of [part.body, part.rootElement, part.notes, part.comments]) {
      if (Array.isArray(root)) clean({ children: root }, seen);
      else if (isNode(root)) clean(root, seen);
    }
  }
  return document;
}
