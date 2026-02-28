import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { parseAsStringEnum, useQueryState } from "nuqs";

type TimeRange = "90d" | "30d" | "7d";

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

export const ChartAreaFilter = () => {
  const [timeRange, setTimeRange] = useQueryState(
    "timeRange",
    parseAsStringEnum<TimeRange>(
      TIME_RANGE_OPTIONS.map((option) => option.value),
    ).withDefault(TIME_RANGE_OPTIONS[0].value),
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
