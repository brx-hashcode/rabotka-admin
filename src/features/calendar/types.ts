export type TCalendarView = "day" | "week" | "month" | "year" | "agenda";
export type TEventColor =
	| "blue"
	| "green"
	| "red"
	| "yellow"
	| "purple"
	| "orange";
export type TDeliveryChannel = "EMAIL" | "WHATSAPP" | "ALL";

export type TRecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/** What the form's "Repeat" dropdown offers — the frequencies, plus off. */
export type TRepeatPreset = "NONE" | TRecurrenceFrequency;

/** How a series stops: never, on a date, or after a number of occurrences. */
export type TRecurrenceEndMode = "never" | "until" | "count";

/**
 * Which occurrences an edit or delete reaches. Mirrors the backend enum of the
 * same name; the server defaults to THIS when this is absent.
 */
export type TEventEditScope = "THIS" | "THIS_AND_FOLLOWING" | "ALL";
