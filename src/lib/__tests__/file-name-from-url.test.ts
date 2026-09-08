import { describe, expect, it } from "vitest";
import { fileNameFromUrl } from "#/lib/media/file-name-from-url";

const SIGNED =
  "https://rabotka-kyc-document.acct.r2.cloudflarestorage.com/kyc-documents/" +
  "1787425827340_xifmj6.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256" +
  "&X-Amz-Credential=bf1f8d54%2F20260822%2Fauto%2Fs3%2Faws4_request" +
  "&X-Amz-Signature=ce6b5b52&X-Amz-SignedHeaders=host&x-id=GetObject";

describe("fileNameFromUrl", () => {
  it("drops the signature query of a signed KYC url", () => {
    // The regression this exists for: as a heading it overflowed the dialog,
    // and as a `download` name it landed on disk verbatim.
    expect(fileNameFromUrl(SIGNED)).toBe("1787425827340_xifmj6.jpg");
  });

  it("is not fooled by encoded slashes inside the signature", () => {
    // X-Amz-Credential contains %2F. Splitting on "/" before cutting the query
    // is what used to pick one of those up.
    expect(fileNameFromUrl(SIGNED)).not.toContain("aws4_request");
  });

  it("still handles a plain public url", () => {
    expect(fileNameFromUrl("https://pub.r2.dev/avatars/a.JPG")).toBe("a.JPG");
  });

  it("drops a fragment too", () => {
    expect(fileNameFromUrl("https://x.dev/a/b.png#page=2")).toBe("b.png");
  });

  it("decodes percent-encoding, since a person reads this", () => {
    expect(fileNameFromUrl("https://x.dev/carte%20identite.jpg")).toBe(
      "carte identite.jpg",
    );
  });

  it("survives a malformed escape rather than throwing", () => {
    expect(fileNameFromUrl("https://x.dev/100%.jpg")).toBe("100%.jpg");
  });

  it("ignores a trailing slash", () => {
    expect(fileNameFromUrl("https://x.dev/folder/name.pdf/")).toBe("name.pdf");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["query only", "https://x.dev/?a=1"],
  ])("falls back for %s so a download always has a name", (_l, url) => {
    expect(fileNameFromUrl(url)).toBe("document");
  });

  it("uses the caller's fallback", () => {
    expect(fileNameFromUrl(null, "image")).toBe("image");
  });
});
