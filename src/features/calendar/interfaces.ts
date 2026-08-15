import type {
	TEventColor,
	TDeliveryChannel,
	TRecurrenceFrequency,
} from "#/features/calendar/types";

export interface IEventRecurrence {
	frequency: TRecurrenceFrequency;
	/** ISO 8601. Null when the series ends by count, or never. */
	until: string | null;
	count: number | null;
}

export interface IUser {
	id: string;
	name: string;
	picturePath: string | null;
}

export interface ICalendarProfile {
	id: string;
	name: string;
	avatarUrl: string | null;
}

export interface IEvent {
	id: number;
	startDate: string;
	endDate: string;
	title: string;
	color: TEventColor;
	description: string;
	channel: TDeliveryChannel;
	user: IUser;
	location: string | null;
	profiles: ICalendarProfile[];
	assignedUsers: IUser[];
	/** Null on a one-off event. Non-null means this is one occurrence of a series. */
	seriesId: string | null;
	occurrenceIndex: number | null;
	recurrence: IEventRecurrence | null;
}

export interface ICalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
