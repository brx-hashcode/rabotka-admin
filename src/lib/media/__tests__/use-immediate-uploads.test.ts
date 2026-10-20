import { describe, expect, it } from "vitest";
import { uploadedUrls, uploadFlags } from "#/lib/media/use-immediate-uploads";

describe("uploadFlags", () => {
  it("is in flight while any image compresses or uploads", () => {
    expect(uploadFlags([{ status: "done" }, { status: "uploading" }])).toEqual({
      inFlight: true,
      failed: false,
    });
    expect(uploadFlags([{ status: "compressing" }]).inFlight).toBe(true);
  });

  it("reports a failed image so the save can wait for a retry", () => {
    expect(uploadFlags([{ status: "done" }, { status: "failed" }])).toEqual({
      inFlight: false,
      failed: true,
    });
    expect(uploadFlags([])).toEqual({ inFlight: false, failed: false });
  });
});

describe("uploadedUrls", () => {
  it("keeps only finished uploads, in on-screen order", () => {
    expect(
      uploadedUrls([
        { status: "done", url: "https://cdn/a.webp" },
        { status: "uploading" },
        { status: "done", url: "https://cdn/b.webp" },
        { status: "failed" },
      ]),
    ).toEqual(["https://cdn/a.webp", "https://cdn/b.webp"]);
  });
});
