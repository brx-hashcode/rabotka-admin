import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { parseAsStringEnum, useQueryState } from "nuqs";

export type TimeRange = "90d" | "30d" | "7d";

export const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  "90d": 90,
  "30d": 30,
  "7d": 7,
};

const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  {
    label: "Last 3 months",
    value: "90d",
  },
  {
    label: "Last 30 days",
    value: "30d",
  },
  {
    label: "Last 7 days",
    value: "7d",
  },
];

export const timeRangeParser = parseAsStringEnum<TimeRange>(
  TIME_RANGE_OPTIONS.map((option) => option.value),
).withDefault(TIME_RANGE_OPTIONS[0].value);

export const TIME_RANGE_QUERY_KEY = "selected-time-range";

export const ChartAreaFilter = () => {
  const [timeRange, setTimeRange] = useQueryState(
    TIME_RANGE_QUERY_KEY,
    timeRangeParser,
  );

  return (
    <ToggleGroup
      type="single"
      value={timeRange}
      onValueChange={(value) => setTimeRange(value as TimeRange)}
      variant="outline"
      className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
    >
      {TIME_RANGE_OPTIONS.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
