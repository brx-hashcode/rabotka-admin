import { parseAsString, useQueryStates } from "nuqs";

import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { RANGE_PRESETS, matchPreset, presetRange } from "#/lib/range-presets";

/**
 * Preset date windows, written to the two URL params the caller names.
 *
 * After picking custom dates through some other control on the same params no
 * preset is highlighted, because none of them describes the window.
 */
export function RangePresetToggle({
  fromKey,
  toKey,
}: Readonly<{ fromKey: string; toKey: string }>) {
  const [range, setRange] = useQueryStates({
    [fromKey]: parseAsString.withDefault(""),
    [toKey]: parseAsString.withDefault(""),
  });

  const preset = matchPreset(range[fromKey], range[toKey]);

  return (
    <ToggleGroup
      type="single"
      value={preset ? String(preset.days) : ""}
      onValueChange={(next) => {
        // ToggleGroup emits "" when the active item is clicked again. Treat
        // that as clearing the window rather than as a no-op, so a reader can
        // get back to the default without hunting for a reset.
        if (!next) {
          void setRange({ [fromKey]: "", [toKey]: "" });
          return;
        }
        const { from, to } = presetRange(Number(next));
        void setRange({ [fromKey]: from, [toKey]: to });
      }}
      variant="outline"
      size="sm"
      className="flex *:data-[slot=toggle-group-item]:px-3!"
    >
      {RANGE_PRESETS.map((preset) => (
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
