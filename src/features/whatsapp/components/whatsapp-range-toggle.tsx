import { format, subDays } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";

import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";

/**
 * Preset windows for the WhatsApp analytics and consumption tabs.
 *
 * Writes to the SAME `created_from` / `created_to` params the date pickers
 * use, rather than carrying a range key of its own. One source of truth means
 * a preset and a hand-picked range can never disagree — with two independent
 * controls the page would have to decide which one wins, and whichever it
 * chose would be wrong half the time.
 *
 * The flip side, and the reason `activePreset` exists: after picking custom
 * dates no preset is highlighted, because none of them describes the window.
 */

const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "3 months", days: 90 },
  // Meta's analytics lookback is one year, so this is the longest window worth
  // offering — the backend clamps anything older anyway.
  { label: "6 months", days: 180 },
] as const;

const ISO_DAY = "yyyy-MM-dd";

/** The preset that exactly describes the current range, if any. */
function matchPreset(from: string, to: string) {
  if (!from || !to) return null;
  if (to !== format(new Date(), ISO_DAY)) return null;
  return (
    PRESETS.find(
      (preset) => from === format(subDays(new Date(), preset.days), ISO_DAY),
    ) ?? null
  );
}

function activePreset(from: string, to: string): string {
  const preset = matchPreset(from, to);
  return preset ? String(preset.days) : "";
}

/**
 * The current window, for a card label.
 *
 * Named presets read back by name — "last 7 days", not
 * "2026-08-11 → 2026-08-18". The dates are technically the same information
 * and meaningfully harder to parse at a glance, which is the whole job of a
 * label sitting above a number.
 */
export function describeRange(from: string, to: string): string {
  const preset = matchPreset(from, to);
  if (preset) return `last ${preset.label}`;
  if (!from && !to) return "last 30 days";
  return `${from || "start"} → ${to || "today"}`;
}

export function WhatsappRangeToggle() {
  const [range, setRange] = useQueryStates({
    created_from: parseAsString.withDefault(""),
    created_to: parseAsString.withDefault(""),
  });

  const value = activePreset(range.created_from, range.created_to);

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        // ToggleGroup emits "" when the active item is clicked again. Treat
        // that as clearing the window rather than as a no-op, so a reader can
        // get back to the default without hunting for a reset.
        if (!next) {
          void setRange({ created_from: "", created_to: "" });
          return;
        }
        const days = Number(next);
        void setRange({
          created_from: format(subDays(new Date(), days), ISO_DAY),
          created_to: format(new Date(), ISO_DAY),
        });
      }}
      variant="outline"
      size="sm"
      className="flex *:data-[slot=toggle-group-item]:px-3!"
    >
      {PRESETS.map((preset) => (
        <ToggleGroupItem
          key={preset.days}
          value={String(preset.days)}
          className="cursor-pointer text-xs"
        >
          {preset.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
