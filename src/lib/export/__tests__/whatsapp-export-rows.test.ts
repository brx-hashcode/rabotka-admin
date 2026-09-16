import { describe, expect, it } from "vitest";
import type { WhatsappMessageItem } from "#/lib/api/whatsapp-controller";
import {
  WHATSAPP_EXPORT_HEADERS,
  whatsappItemsToStringRows,
  whatsappItemsToTypedRows,
} from "#/lib/export/whatsapp-export-rows";

const at = (header: (typeof WHATSAPP_EXPORT_HEADERS)[number]) =>
  WHATSAPP_EXPORT_HEADERS.indexOf(header);

const base: WhatsappMessageItem = {
  id: "msg-1",
  createdAt: "2026-08-20T08:00:00.000Z",
  provider: "cloud",
  providerMessageId: "wamid.ABC",
  direction: "OUTBOUND",
  toPhone: "+242065219464",
  profileId: "prof-1",
  profileName: "Alice Nkembo",
  kind: "template",
  templateKey: "kyc_v3",
  templateCategory: "MARKETING",
  bodyPreview: "Bonjour Alice",
  variables: { name: "Alice", code: "4821" },
  status: "DELIVERED" as WhatsappMessageItem["status"],
  sentAt: "2026-08-20T08:00:02.000Z",
  deliveredAt: "2026-08-20T08:00:09.000Z",
  readAt: "2026-08-20T08:01:00.000Z",
  failedAt: null,
  errorCode: null,
  errorProviderCode: null,
  errorMessage: null,
  // Deliberately different from templateCategory: one is what we declared, the
  // other what Meta billed. They must not collapse into one column.
  pricingCategory: "UTILITY",
  billable: true,
  sentByName: "Fariol",
};

const failed: WhatsappMessageItem = {
  ...base,
  id: "msg-2",
  status: "FAILED" as WhatsappMessageItem["status"],
  bodyPreview: "[TPL:kyc_v3]",
  variables: null,
  profileId: null,
  profileName: null,
  templateKey: null,
  deliveredAt: null,
  readAt: null,
  failedAt: "2026-08-20T08:00:03.000Z",
  errorCode: "TEMPLATE_NOT_FOUND",
  errorProviderCode: 131047,
  errorMessage: "Template name does not exist",
  billable: null,
  providerMessageId: null,
};

const inbound: WhatsappMessageItem = {
  ...base,
  id: "msg-3",
  direction: "INBOUND",
  kind: "text",
  templateKey: null,
  variables: {},
  sentByName: null,
};

describe("whatsapp export rows", () => {
  it("keeps both builders the same width as the headers", () => {
    const items = [base, failed, inbound];
    for (const row of whatsappItemsToStringRows(items)) {
      expect(row).toHaveLength(WHATSAPP_EXPORT_HEADERS.length);
    }
    for (const row of whatsappItemsToTypedRows(items)) {
      expect(row).toHaveLength(WHATSAPP_EXPORT_HEADERS.length);
    }
  });

  it("writes variables as compact JSON, and empty when there are none", () => {
    const [ok, none, empty] = whatsappItemsToStringRows([
      base,
      failed,
      inbound,
    ]);
    expect(ok[at("Message details")]).toBe('{"name":"Alice","code":"4821"}');
    expect(none[at("Message details")]).toBe("");
    // `{}` is noise that reads as data.
    expect(empty[at("Message details")]).toBe("");
  });

  it("leaves billable blank when Meta has not said yet", () => {
    const [ok, unknown] = whatsappItemsToStringRows([base, failed]);
    expect(ok[at("Paid message")]).toBe("Yes");
    expect(unknown[at("Paid message")]).toBe("");
    // "No" would assert we were not charged, which is a different claim.
    expect(unknown[at("Paid message")]).not.toBe("No");
  });

  it("keeps the provider error code numeric for xlsx and a string for csv", () => {
    const [, typedFailed] = whatsappItemsToTypedRows([base, failed]);
    const [, stringFailed] = whatsappItemsToStringRows([base, failed]);
    expect(typedFailed[at("WhatsApp error number")]).toBe(131047);
    expect(stringFailed[at("WhatsApp error number")]).toBe("131047");
  });

  it("blanks a missing timestamp rather than zeroing it", () => {
    const [typed] = whatsappItemsToTypedRows([failed]);
    const [str] = whatsappItemsToStringRows([failed]);
    expect(typed[at("Delivered at")]).toBeNull();
    expect(str[at("Delivered at")]).toBe("");
  });

  it("passes timestamps through byte-identical", () => {
    // Guards against a future "helpful" round-trip through new Date(), which
    // would silently relocalise every cell.
    const [row] = whatsappItemsToTypedRows([base]);
    expect(row[at("Created at")]).toBe("2026-08-20T08:00:00.000Z");
    expect(row[at("Read at")]).toBe("2026-08-20T08:01:00.000Z");
  });

  it("derives time to delivery, and leaves it empty when it cannot", () => {
    const [okTyped, failedTyped] = whatsappItemsToTypedRows([base, failed]);
    const [okStr, failedStr] = whatsappItemsToStringRows([base, failed]);
    expect(okTyped[at("Time to delivery (seconds)")]).toBe(7);
    expect(okStr[at("Time to delivery (seconds)")]).toBe("7");
    expect(failedTyped[at("Time to delivery (seconds)")]).toBeNull();
    expect(failedStr[at("Time to delivery (seconds)")]).toBe("");
  });

  it("records direction, which no filter exposes and every export mixes", () => {
    const [out, , in_] = whatsappItemsToStringRows([base, failed, inbound]);
    expect(out[at("Direction")]).toBe("OUTBOUND");
    expect(in_[at("Direction")]).toBe("INBOUND");
  });

  it("keeps declared and billed categories apart", () => {
    const [row] = whatsappItemsToStringRows([base]);
    expect(row[at("Message category")]).toBe("MARKETING");
    expect(row[at("Billed as")]).toBe("UTILITY");
  });
});
