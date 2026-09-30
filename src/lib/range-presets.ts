import { format, subDays } from "date-fns";

export const RANGE_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "3 months", days: 90 },
  // Meta's analytics lookback is one year, so this is the longest window worth
  // offering — the backend clamps anything older anyway.
  { label: "6 months", days: 180 },
] as const;

const ISO_DAY = "yyyy-MM-dd";

/** The `from` / `to` pair a preset stands for, ending today. */
export function presetRange(days: number): { from: string; to: string } {
  return {
    from: format(subDays(new Date(), days), ISO_DAY),
    to: format(new Date(), ISO_DAY),
  };
}

/** The preset that exactly describes the current range, if any. */
export function matchPreset(from: string, to: string) {
  if (!from || !to) return null;
  if (to !== format(new Date(), ISO_DAY)) return null;
  return (
    RANGE_PRESETS.find((preset) => from === presetRange(preset.days).from) ??
    null
  );
}

/**
 * The current window, for a card label.
 *
 * Named presets read back by name — "last 7 days", not
 * "2026-08-11 → 2026-08-18". The dates are technically the same information
 * and meaningfully harder to parse at a glance, which is the whole job of a
 * label sitting above a number.
 *
 * `emptyLabel` is what no range at all means, which is the caller's to say:
 * each endpoint has its own default window.
 */
export function describeRange(
  from: string,
  to: string,
  emptyLabel: string,
): string {
  const preset = matchPreset(from, to);
  if (preset) return `last ${preset.label}`;
  if (!from && !to) return emptyLabel;
  return `${from || "start"} → ${to || "today"}`;
}
