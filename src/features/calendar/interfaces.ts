import type { TEventColor, TDeliveryChannel } from "#/features/calendar/types";

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
}

export interface ICalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
