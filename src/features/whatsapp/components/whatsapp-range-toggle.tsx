import { RangePresetToggle } from "#/components/range-preset-toggle";
import { describeRange as describePresetRange } from "#/lib/range-presets";

/**
 * Preset windows for the WhatsApp analytics and consumption tabs.
 *
 * Writes to the SAME `created_from` / `created_to` params the date pickers
 * use, rather than carrying a range key of its own. One source of truth means
 * a preset and a hand-picked range can never disagree — with two independent
 * controls the page would have to decide which one wins, and whichever it
 * chose would be wrong half the time.
 */

/** The current window, for a card label. No range means the last 30 days. */
export function describeRange(from: string, to: string): string {
  return describePresetRange(from, to, "last 30 days");
}

export function WhatsappRangeToggle() {
  return <RangePresetToggle fromKey="created_from" toKey="created_to" />;
}
