import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "#/lib/utils";
import { fold } from "#/lib/search";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "#/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";

export type GeoOption = { value: string; label: string };

/**
 * How many options may reach the DOM at once. The city dataset covers every
 * place above 500 inhabitants worldwide — ~15 000 for France or the United
 * States — and rendering them all freezes the tab.
 */
const MAX_OPTIONS = 50;

type Props = {
  readonly options: GeoOption[];
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly disabled?: boolean;
};

/**
 * A searchable single-select over a static list.
 *
 * Separate from `ProfileCombobox`, which queries the server on each keystroke
 * and is built on DropdownMenu for that reason. Countries and cities arrive as
 * one fixed list, so filtering belongs on the client — `Command` does it, and
 * a 250-item DropdownMenu with a hand-rolled filter would be strictly worse.
 *
 * `value` is the stored value (a country code, or a city name); `label` is what
 * the user reads. Keeping them distinct is what stops a country being stored by
 * its display name.
 */
export function GeoCombobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.value === value);

  // Filtered here rather than by cmdk, because cmdk filters what is already
  // rendered and the whole point is not to render it all.
  const q = fold(search);
  const matched = q
    ? options.filter((o) => fold(o.label).includes(q))
    : options;
  const visible = matched.slice(0, MAX_OPTIONS);
  const hidden = matched.length - visible.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* A plain button, not <Button asChild>: this app's Button is base-ui,
          which has no asChild. */}
      <PopoverTrigger
        type="button"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className={cn(
          "border-input bg-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-1 text-sm shadow-xs",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      {/* `--anchor-width` is base-ui's variable — the Radix name this started
          with does not exist here, so the panel took its own width and sat
          narrower than, and offset from, the field above it.

          MIN-width rather than width: pinned to the trigger exactly, a field in
          a two-column grid is narrower than its own options, and
          "Congo-Brazzaville" wrapped onto two lines and lost its last letter to
          the panel's `overflow-hidden`. It now starts at the field's width and
          grows to fit the longest label, capped at what the viewport allows so
          it can never run off-screen. */}
      <PopoverContent
        align="start"
        className="min-w-(--anchor-width) w-max max-w-(--available-width) p-0 [--viewport-inline-padding:0px]"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-60">
            <CommandEmpty>No result.</CommandEmpty>
            <CommandGroup>
              {visible.map((o) => (
                <CommandItem
                  key={o.value}
                  // The label, not the code: it is what keyboard navigation
                  // and screen readers announce.
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value === value ? null : o.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4 shrink-0",
                      value === o.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {/* One line per option: a wrapped city name reads as two
                      entries, and the row's height stops matching its
                      neighbours. */}
                  <span className="truncate">{o.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {hidden > 0 && (
              <p className="text-muted-foreground px-3 py-2 text-center text-xs">
                {hidden} more — refine your search
              </p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
