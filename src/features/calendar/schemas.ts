import { z } from "zod";

import { MAX_OCCURRENCE_COUNT } from "#/features/calendar/constants";

export const eventSchema = z
	.object({
		title: z.string().min(1, "Title is required"),
		description: z.string().min(1, "Description is required"),
		// `error`, not `required_error`: this is zod 4, where the old key is
		// silently ignored — so these messages never actually appeared.
		startDate: z.date({ error: "Start date is required" }),
		endDate: z.date({ error: "End date is required" }),
		color: z.enum(["blue", "green", "red", "yellow", "purple", "orange"]),
		channel: z.enum(["EMAIL", "WHATSAPP", "ALL"]),
		location: z.string().optional(),
		profileIds: z.array(z.string()).default([]),
		userIds: z.array(z.string()).default([]),
		// Flat rather than a nested `recurrence` object: every field in this form
		// is addressed by a flat `name=` in add-edit-event-dialog, and nested
		// defaults are the awkward part of resetting a react-hook-form.
		repeatFrequency: z
			.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
			.default("NONE"),
		repeatEndMode: z.enum(["never", "until", "count"]).default("never"),
		repeatUntil: z.date().optional(),
		repeatCount: z.number().int().min(1).max(MAX_OCCURRENCE_COUNT).optional(),
	})
	.superRefine((values, ctx) => {
		if (values.endDate < values.startDate) {
			ctx.addIssue({
				path: ["endDate"],
				code: "custom",
				message: "End date must be after the start date",
			});
		}

		// The repeat fields stay in the form state when the user switches back to
		// "Does not repeat", so they are only worth validating when they apply.
		if (values.repeatFrequency === "NONE") return;

		if (values.repeatEndMode === "until") {
			if (!values.repeatUntil) {
				ctx.addIssue({
					path: ["repeatUntil"],
					code: "custom",
					message: "Pick the date the repetition should stop",
				});
			} else if (values.repeatUntil <= values.startDate) {
				ctx.addIssue({
					path: ["repeatUntil"],
					code: "custom",
					message: "The end of the repetition must be after the first date",
				});
			}
		}

		if (values.repeatEndMode === "count" && !values.repeatCount) {
			ctx.addIssue({
				path: ["repeatCount"],
				code: "custom",
				message: "Enter how many times it should repeat",
			});
		}
	});

export type TEventFormData = z.infer<typeof eventSchema>;
