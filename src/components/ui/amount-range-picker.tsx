import * as React from "react";
import { ListFilterIcon } from "lucide-react";

import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";

type AmountRangePickerProps = {
  min: number | null;
  max: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  className?: string;
};

/** Matches the table's own `amount.toLocaleString()` so the chip reads like the column. */
function formatAmount(value: number): string {
  return `${value.toLocaleString()} FCFA`;
}

function summarize(min: number | null, max: number | null): string | null {
  if (min != null && max != null) {
    return `${min.toLocaleString()} – ${formatAmount(max)}`;
  }
  if (min != null) return `≥ ${formatAmount(min)}`;
  if (max != null) return `≤ ${formatAmount(max)}`;
  return null;
}

/**
 * Parses what someone typed into a bound.
 *
 * Returns `null` for an empty field, meaning "no bound" — deliberately distinct
 * from 0, which is a real bound. Anything unparseable is also treated as no
 * bound rather than coerced to 0, so a stray keystroke cannot silently turn
 * "any amount" into "free only".
 */
function parseBound(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

/**
 * A two-field numeric range filter, shaped to sit in a table toolbar beside the
 * faceted filter dropdowns.
 *
 * Bounds are committed on blur and on Enter rather than on every keystroke. The
 * search box in the same toolbar does commit per keystroke, and for text that is
 * right — a prefix is a meaningful query. A half-typed number is not: typing
 * "25000" would run, and page-reset, four wrong filters ("2", "25", "250",
 * "2500") on the way to the intended one.
 */
export function AmountRangePicker({
  min,
  max,
  onMinChange,
  onMaxChange,
  className,
}: Readonly<AmountRangePickerProps>) {
  const [open, setOpen] = React.useState(false);
  const [minDraft, setMinDraft] = React.useState(min?.toString() ?? "");
  const [maxDraft, setMaxDraft] = React.useState(max?.toString() ?? "");

  // The URL is the source of truth: it also changes via Reset, the browser back
  // button, and a shared link, none of which go through the inputs.
  React.useEffect(() => {
    setMinDraft(min?.toString() ?? "");
  }, [min]);
  React.useEffect(() => {
    setMaxDraft(max?.toString() ?? "");
  }, [max]);

  const summary = summarize(min, max);
  const invalid = min != null && max != null && min > max;

  const commit = () => {
    onMinChange(parseBound(minDraft));
    onMaxChange(parseBound(maxDraft));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      setOpen(false);
    }
  };

  const clear = () => {
    setMinDraft("");
    setMaxDraft("");
    onMinChange(null);
    onMaxChange(null);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Committing on close covers the case where the popover is dismissed by
        // clicking away, which fires no blur on the focused input.
        if (!next) commit();
        setOpen(next);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-9 flex-wrap justify-center gap-1.5 border-dashed cursor-pointer",
              className,
            )}
          >
            <ListFilterIcon className="size-4 shrink-0" aria-hidden />
            <span>Amount</span>
            {summary && (
              <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
                {summary}
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-72 space-y-3 p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="amount-min" className="text-xs font-normal">
              Min
            </Label>
            <Input
              id="amount-min"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Any"
              className="h-8"
              value={minDraft}
              onChange={(e) => setMinDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
            />
          </div>
          <span className="text-muted-foreground pb-2 text-xs">–</span>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="amount-max" className="text-xs font-normal">
              Max
            </Label>
            <Input
              id="amount-max"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Any"
              className="h-8"
              value={maxDraft}
              onChange={(e) => setMaxDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {invalid && (
          <p className="text-destructive text-xs">
            Min is above max — no offer can match.
          </p>
        )}

        <p className="text-muted-foreground text-xs">
          Offers with no amount set are excluded while either bound is active.
        </p>

        {summary && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center text-sm cursor-pointer"
            onClick={clear}
          >
            Clear amount
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
