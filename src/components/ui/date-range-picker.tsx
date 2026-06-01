import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { IconCalendar, IconX } from "@tabler/icons-react";

import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";

type SingleDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: (date: Date) => boolean;
  className?: string;
};

function SingleDatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: Readonly<SingleDatePickerProps>) {
  const [open, setOpen] = React.useState(false);

  const date = value && isValid(parseISO(value)) ? parseISO(value) : undefined;

  const handleSelect = (selected: Date | undefined) => {
    onChange(selected ? format(selected, "yyyy-MM-dd") : "");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="flex items-center">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 justify-start gap-1.5 text-xs font-normal",
              !date && "text-muted-foreground",
              date ? "rounded-r-none border-r-0" : "",
              className,
            )}
          >
            <IconCalendar className="size-3.5 shrink-0" />
            <span>{date ? format(date, "MMM d, yyyy") : placeholder}</span>
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
    {date && (
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-7 px-0 rounded-l-none text-muted-foreground hover:text-foreground"
        onClick={handleClear}
        aria-label="Clear date"
      >
        <IconX className="size-3" />
      </Button>
    )}
    </div>
  );
}

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
  const disableTo = from && isValid(parseISO(from))
    ? (date: Date) => date < parseISO(from)
    : undefined;

  const disableFrom = to && isValid(parseISO(to))
    ? (date: Date) => date > parseISO(to)
    : undefined;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <SingleDatePicker
        value={from}
        onChange={onFromChange}
        placeholder="From"
        disabled={disableFrom}
      />
      <span className="text-muted-foreground text-xs">–</span>
      <SingleDatePicker
        value={to}
        onChange={onToChange}
        placeholder="To"
        disabled={disableTo}
      />
    </div>
  );
}
