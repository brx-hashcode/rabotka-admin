/**
 * Quarter turns for the document viewer.
 *
 * Extracted from the viewer because it is the only part of rotation that can be
 * wrong in a way tests can catch: the wrap at either end of the circle, and
 * knowing when a turn has swapped the axes. Everything else there is CSS.
 */
export type Rotation = 0 | 90 | 180 | 270;

/** The next quarter turn clockwise, wrapping past a full circle back to flat. */
export function rotateRight(current: Rotation): Rotation {
  return ((current + 90) % 360) as Rotation;
}

/**
 * The next quarter turn anticlockwise, wrapping below zero back to 270.
 *
 * `+ 270` rather than `- 90` because JavaScript's `%` keeps the sign of the
 * left operand: `(0 - 90) % 360` is `-90`, not `270`. That renders correctly in
 * CSS, which is what makes it easy to miss — the image turns the right way and
 * only the degree readout beside the button gives it away.
 */
export function rotateLeft(current: Rotation): Rotation {
  return ((current + 270) % 360) as Rotation;
}

/**
 * Whether this turn has swapped the image's width and height.
 *
 * A CSS transform does not change layout, so a quarter-turned image keeps the
 * footprint it had upright — which is how a turned portrait scan ends up wider
 * than the panel holding it. Callers use this to constrain against the opposite
 * axis. A half turn needs none of that: the box is the same either way.
 */
export function isQuarterTurn(rotation: Rotation): boolean {
  return rotation % 180 !== 0;
}
