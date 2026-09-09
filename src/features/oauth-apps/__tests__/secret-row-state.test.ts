import { describe, expect, it } from "vitest";
import { secretRowState } from "../secret-row-state";

describe("secretRowState", () => {
  it("offers nothing on a real application", () => {
    expect(secretRowState({ isSandbox: false, canCopySecret: false })).toBe(
      "hidden",
    );
  });

  it("offers a copy control on a sandbox app with a stored secret", () => {
    expect(secretRowState({ isSandbox: true, canCopySecret: true })).toBe(
      "copyable",
    );
  });

  it("asks for a rotation on a sandbox app registered before the column", () => {
    expect(secretRowState({ isSandbox: true, canCopySecret: false })).toBe(
      "needs-rotation",
    );
  });

  it("treats a missing canCopySecret as needing a rotation", () => {
    // What an older backend returns. The card must degrade to the explained
    // state rather than offering a button that would 404.
    expect(secretRowState({ isSandbox: true })).toBe("needs-rotation");
  });

  it("never offers a copy control on a real app, whatever the server said", () => {
    // Defence in depth: the server refuses the read anyway, but a bug that set
    // this flag on a real application must not put a button on it. The UI
    // should not be what discovers the mistake by offering the secret.
    expect(secretRowState({ isSandbox: false, canCopySecret: true })).toBe(
      "hidden",
    );
  });
});
