import { describe, expect, it } from "vitest";

import {
  REASON_TEMPLATES,
  appendReason,
  getReasonTemplates,
  groupReasonTemplates,
  type ReasonTemplateScope,
} from "../reason-templates";

const ALL_SCOPES: ReasonTemplateScope[] = [
  "ACCOUNT_ACTIVATE",
  "ACCOUNT_SUSPEND",
  "KYC_APPROVE",
  "KYC_REJECT",
  "PAYMENT_ACCEPT",
  "PAYMENT_REJECT",
];

describe("REASON_TEMPLATES", () => {
  it("has a unique id per template", () => {
    const ids = REASON_TEMPLATES.map((template) => template.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("declares at least one scope per template", () => {
    for (const template of REASON_TEMPLATES) {
      expect(template.scopes.length).toBeGreaterThan(0);
    }
  });

  it("ends every body with a period so two picks concatenate cleanly", () => {
    for (const template of REASON_TEMPLATES) {
      expect(template.body.trimEnd().endsWith(".")).toBe(true);
    }
  });
});

describe("getReasonTemplates", () => {
  it("offers nothing until a decision is picked", () => {
    expect(getReasonTemplates(null)).toEqual([]);
  });

  it("returns at least one template for every scope", () => {
    for (const scope of ALL_SCOPES) {
      expect(getReasonTemplates(scope).length).toBeGreaterThan(0);
    }
  });

  it("only returns templates declaring the requested scope", () => {
    for (const template of getReasonTemplates("KYC_REJECT")) {
      expect(template.scopes).toContain("KYC_REJECT");
    }
  });

  it("keeps approve and reject suggestions apart", () => {
    const approveIds = getReasonTemplates("KYC_APPROVE").map((t) => t.id);
    const rejectIds = getReasonTemplates("KYC_REJECT").map((t) => t.id);

    expect(approveIds.some((id) => rejectIds.includes(id))).toBe(false);
  });
});

describe("groupReasonTemplates", () => {
  it("groups by category, preserving declaration order", () => {
    const groups = groupReasonTemplates(getReasonTemplates("KYC_REJECT"));

    expect(groups.map((group) => group.category)).toEqual([
      "Document",
      "Identité",
      "Fraude",
    ]);
    expect(groups[0].templates[0].id).toBe("kyc-reject-unreadable");
  });

  it("keeps every template", () => {
    const templates = getReasonTemplates("ACCOUNT_SUSPEND");
    const grouped = groupReasonTemplates(templates).flatMap((g) => g.templates);

    expect(grouped).toHaveLength(templates.length);
  });

  it("returns no group for an empty list", () => {
    expect(groupReasonTemplates([])).toEqual([]);
  });
});

describe("appendReason", () => {
  it("inserts into an empty field", () => {
    expect(appendReason("", "Document illisible.")).toBe("Document illisible.");
  });

  it("treats a whitespace-only field as empty", () => {
    expect(appendReason("   \n", "Document illisible.")).toBe(
      "Document illisible.",
    );
  });

  it("appends after a single space, keeping what was typed", () => {
    expect(appendReason("Déjà écrit.", "Document illisible.")).toBe(
      "Déjà écrit. Document illisible.",
    );
  });

  it("does not double the separator when the field ends in whitespace", () => {
    expect(appendReason("Déjà écrit.  ", "Document illisible.")).toBe(
      "Déjà écrit. Document illisible.",
    );
  });
});
