import { endOfDay, format } from "date-fns";

import type { IEventRecurrence } from "#/features/calendar/interfaces";
import type {
	TRecurrenceEndMode,
	TRecurrenceFrequency,
	TRepeatPreset,
} from "#/features/calendar/types";
import type { EventRecurrenceParams } from "#/lib/api/events-controller";

const FREQUENCY_ADVERBS: Record<TRecurrenceFrequency, string> = {
	DAILY: "daily",
	WEEKLY: "weekly",
	MONTHLY: "monthly",
	YEARLY: "yearly",
};

/** The repeat rule as a sentence, for the event detail sheet. */
export function describeRecurrence(
	recurrence: IEventRecurrence | null | undefined,
): string | null {
	if (!recurrence) return null;

	const base = `Repeats ${FREQUENCY_ADVERBS[recurrence.frequency]}`;
	if (recurrence.until) {
		return `${base} until ${format(new Date(recurrence.until), "MMM d, yyyy")}`;
	}
	if (recurrence.count) {
		return `${base}, ${recurrence.count} times`;
	}
	return base;
}

type RepeatFormFields = {
	repeatFrequency: TRepeatPreset;
	repeatEndMode: TRecurrenceEndMode;
	repeatUntil?: Date;
	repeatCount?: number;
};

/**
 * The form's flat repeat fields as the API's recurrence object.
 *
 * `undefined` for a non-repeating event — the server reads the absence of the
 * field as "one-off", so sending `{ frequency: "NONE" }` would be a validation
 * error rather than a no-op.
 */
export function toRecurrenceParams(
	values: RepeatFormFields,
): EventRecurrenceParams | undefined {
	if (values.repeatFrequency === "NONE") return undefined;

	const recurrence: EventRecurrenceParams = {
		frequency: values.repeatFrequency,
	};

	// Exactly one end condition, or none — the server rejects a rule carrying
	// both, and the two fields keep their values when the mode is switched.
	if (values.repeatEndMode === "until" && values.repeatUntil) {
		// End of the chosen day, so "until 31 December" includes the 31st.
		recurrence.until = endOfDay(values.repeatUntil).toISOString();
	} else if (values.repeatEndMode === "count" && values.repeatCount) {
		recurrence.count = values.repeatCount;
	}

	return recurrence;
}

/** The inverse, for opening the form on an existing event. */
export function fromRecurrence(
	recurrence: IEventRecurrence | null | undefined,
): RepeatFormFields {
	if (!recurrence) {
		return { repeatFrequency: "NONE", repeatEndMode: "never" };
	}

	let repeatEndMode: TRecurrenceEndMode = "never";
	if (recurrence.until) repeatEndMode = "until";
	else if (recurrence.count) repeatEndMode = "count";

	return {
		repeatFrequency: recurrence.frequency,
		repeatEndMode,
		repeatUntil: recurrence.until ? new Date(recurrence.until) : undefined,
		repeatCount: recurrence.count ?? undefined,
	};
}
