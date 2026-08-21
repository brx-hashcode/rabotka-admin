import { describe, it, expect } from "vitest";
import {
  docCategoryLabel,
  docTypeLabel,
} from "#/pages/profile-detail/helpers";

describe("docCategoryLabel", () => {
  it("names which side of the document a row holds", () => {
    // Both sides render as cards in the same grid, so "Identity Document" for
    // each would leave a reviewer unable to tell them apart.
    expect(docCategoryLabel("DOCUMENT")).toBe("Identity Document (Front)");
    expect(docCategoryLabel("DOCUMENT_BACK")).toBe("Identity Document (Back)");
  });

  it("labels the selfie", () => {
    expect(docCategoryLabel("SELFIE")).toBe("Selfie");
  });

  it("falls back rather than blanking on an unknown category", () => {
    expect(docCategoryLabel("SOMETHING_ELSE")).toBe("Identity Document");
  });
});

describe("docTypeLabel", () => {
  it("labels the four accepted types", () => {
    expect(docTypeLabel("IDENTITY_CARD")).toBe("Identity Card");
    expect(docTypeLabel("PASSPORT")).toBe("Passport");
    expect(docTypeLabel("DRIVER_LICENSE")).toBe("Driver License");
    expect(docTypeLabel("NIU_CARD")).toBe("NIU Card");
  });

  it("handles a profile whose type was cleared", () => {
    // Rows on a since-removed type were set NULL by the backend migration.
    expect(docTypeLabel(null)).toBe("Document");
  });

  it("echoes an unknown type instead of blanking the card", () => {
    expect(docTypeLabel("BIRTH_CERTIFICATE")).toBe("BIRTH_CERTIFICATE");
  });
});
