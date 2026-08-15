import type {
	TEventColor,
	TRecurrenceEndMode,
	TRepeatPreset,
} from "#/features/calendar/types";

export const COLORS: TEventColor[] = [
	"blue",
	"green",
	"red",
	"yellow",
	"purple",
	"orange",
];

export const REPEAT_PRESETS: { value: TRepeatPreset; label: string }[] = [
	{ value: "NONE", label: "Does not repeat" },
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "YEARLY", label: "Yearly" },
];

export const RECURRENCE_END_MODES: {
	value: TRecurrenceEndMode;
	label: string;
}[] = [
	{ value: "never", label: "Never" },
	{ value: "until", label: "On a date" },
	{ value: "count", label: "After a number of times" },
];

/** Matches MAX_OCCURRENCES_PER_SERIES on the server, which rejects anything above it. */
export const MAX_OCCURRENCE_COUNT = 365;
