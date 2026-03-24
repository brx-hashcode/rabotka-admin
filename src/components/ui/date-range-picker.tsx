import * as React from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { IconCalendar, IconX } from "@tabler/icons-react";

import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";

type DateRangePickerProps = {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  className?: string;
};

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  className,
}: Readonly<DateRangePickerProps>) {
  const [open, setOpen] = React.useState(false);

  const range: DateRange = {
    from: from ? parseISO(from) : undefined,
    to: to ? parseISO(to) : undefined,
  };

  const handleSelect = (value: DateRange | undefined) => {
    onFromChange(value?.from ? format(value.from, "yyyy-MM-dd") : "");
    onToChange(value?.to ? format(value.to, "yyyy-MM-dd") : "");
    if (value?.from && value.to) setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFromChange("");
    onToChange("");
  };

  const hasRange = Boolean(from || to);

  const label = from && to
    ? `${format(parseISO(from), "MMM d, yyyy")} – ${format(parseISO(to), "MMM d, yyyy")}`
    : from
      ? `From ${format(parseISO(from), "MMM d, yyyy")}`
      : "Pick date range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-xs font-normal",
            !hasRange && "text-muted-foreground",
            className,
          )}
        >
          <IconCalendar className="size-3.5" />
          <span>{label}</span>
          {hasRange && (
            <IconX
              className="size-3 ml-0.5 opacity-60 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
