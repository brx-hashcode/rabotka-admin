import { describe, expect, it } from "vitest";

import {
  isQuarterTurn,
  rotateLeft,
  rotateRight,
  type Rotation,
} from "#/lib/media/rotation";

describe("rotateRight", () => {
  it("steps a quarter turn clockwise", () => {
    expect(rotateRight(0)).toBe(90);
    expect(rotateRight(90)).toBe(180);
    expect(rotateRight(180)).toBe(270);
  });

  it("wraps back to flat instead of running past a full circle", () => {
    // The whole reason this is a function rather than `r + 90`. Without the
    // modulo the viewer reaches 360 and then 450, which CSS renders correctly
    // and which makes the degree readout beside the button nonsense.
    expect(rotateRight(270)).toBe(0);
  });
});

describe("rotateLeft", () => {
  it("steps a quarter turn anticlockwise", () => {
    expect(rotateLeft(270)).toBe(180);
    expect(rotateLeft(180)).toBe(90);
    expect(rotateLeft(90)).toBe(0);
  });

  it("wraps below zero to 270 rather than to a negative angle", () => {
    // `%` keeps the sign of its left operand, so a naive `(r - 90) % 360` gives
    // -90 here. CSS turns the image correctly either way, which is what makes
    // it easy to ship: only the readout gives it away.
    expect(rotateLeft(0)).toBe(270);
  });
});

describe("the two directions together", () => {
  it("undo each other", () => {
    for (const r of [0, 90, 180, 270] as Rotation[]) {
      expect(rotateLeft(rotateRight(r))).toBe(r);
      expect(rotateRight(rotateLeft(r))).toBe(r);
    }
  });

  it("each return to the start after four presses", () => {
    let right: Rotation = 0;
    let left: Rotation = 0;
    for (let i = 0; i < 4; i++) {
      right = rotateRight(right);
      left = rotateLeft(left);
    }
    expect(right).toBe(0);
    expect(left).toBe(0);
  });
});

describe("isQuarterTurn", () => {
  it("is true only when the axes have been swapped", () => {
    // This is what decides whether the image is constrained against the
    // container's width or its height. Getting 180 wrong would needlessly
    // shrink an upside-down document to the panel's narrow axis.
    expect(isQuarterTurn(90)).toBe(true);
    expect(isQuarterTurn(270)).toBe(true);
    expect(isQuarterTurn(0)).toBe(false);
    expect(isQuarterTurn(180)).toBe(false);
  });
});
