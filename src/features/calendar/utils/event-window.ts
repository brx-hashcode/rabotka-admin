import { addDays, addMonths, addWeeks, addYears } from "date-fns";

import type {
	TDurationUnit,
	TRecurrenceFrequency,
} from "#/features/calendar/types";

/** How long an event lasts when nothing says otherwise. Mirrors the server's default. */
export const DEFAULT_EVENT_DURATION_MINUTES = 30;

const MINUTE_MS = 60_000;

const UNIT_MS: Record<TDurationUnit, number> = {
	minutes: MINUTE_MS,
	hours: 60 * MINUTE_MS,
	days: 24 * 60 * MINUTE_MS,
};

export const DURATION_UNITS: { value: TDurationUnit; label: string }[] = [
	{ value: "minutes", label: "minutes" },
	{ value: "hours", label: "hours" },
	{ value: "days", label: "days" },
];

export type EventDuration = { value: number; unit: TDurationUnit };

export function durationToMs({ value, unit }: EventDuration): number {
	return value * UNIT_MS[unit];
}

/**
 * A span in the largest unit that divides it evenly.
 *
 * Used when opening an existing event: a stored 90-minute meeting has to come
 * back as "90 minutes" rather than "1.5 hours", and a 3-day one as "3 days"
 * rather than "4320 minutes".
 */
export function msToDuration(ms: number): EventDuration {
	const safe = Math.max(ms, MINUTE_MS);

	for (const unit of ["days", "hours"] as const) {
		if (safe % UNIT_MS[unit] === 0) {
			return { value: safe / UNIT_MS[unit], unit };
		}
	}

	return { value: Math.round(safe / MINUTE_MS), unit: "minutes" };
}

/**
 * The end the server will store.
 *
 * Derived from a duration rather than picked as a second date, which is what
 * makes an occurrence lasting years unrepresentable — the state that put forty
 * overlapping copies of one event on every cell of the calendar.
 */
export function resolveEventEnd(
	startDate: Date,
	duration: EventDuration,
): Date {
	return new Date(startDate.getTime() + durationToMs(duration));
}

const STEP: Record<TRecurrenceFrequency, (date: Date, n: number) => Date> = {
	DAILY: addDays,
	WEEKLY: addWeeks,
	MONTHLY: addMonths,
	YEARLY: addYears,
};

/**
 * The gap between the first occurrence and the second, in milliseconds.
 *
 * Stepped from the start date rather than read off a table, because a period is
 * not a fixed length: a monthly rule anchored in February steps 28 days and one
 * anchored in March steps 31, and it is the step this event takes that its own
 * duration has to fit inside. Same measurement the server makes, so the form
 * never accepts something the API is about to reject.
 */
export function repeatIntervalMs(
	startDate: Date,
	frequency: TRecurrenceFrequency,
): number {
	return STEP[frequency](startDate, 1).getTime() - startDate.getTime();
}

/** How long an occurrence of this frequency may run, in words. */
export const REPEAT_PERIOD_LABEL: Record<TRecurrenceFrequency, string> = {
	DAILY: "a day",
	WEEKLY: "a week",
	MONTHLY: "a month",
	YEARLY: "a year",
};
