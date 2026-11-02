/**
 * How a line of a business's activity reads in admin. The API logs
 * `METHOD /route/:pattern`; rabotka-business words the same keys in French
 * (src/features/team/activity-labels.ts) — keep the two lists in step.
 */
const RULES: [RegExp, string][] = [
  [/^POST \/job-offers$/, "published an offer"],
  [/^POST \/job-offers\/:\w+\/close$/, "closed an offer"],
  [/^POST \/job-offers\/:\w+\/republish$/, "republished an offer"],
  [/^PATCH \/profile\/job-offers\/:\w+$/, "edited an offer"],
  [/^DELETE \/profile\/job-offers\/:\w+$/, "deleted an offer"],
  [/^POST \/profile\/job-offers\/:\w+\/confirm-hire$/, "confirmed a hire"],
  [/^POST \/profile\/applications\/:\w+\/accept$/, "retained a candidate"],
  [/^POST \/business\/me\/external-applications\/:\w+\/retain$/, "retained a candidate"],
  [/^POST \/profile\/applications\/:\w+\/reject$/, "refused a candidate"],
  [/^POST \/business\/me\/external-applications\/:\w+\/refuse$/, "refused a candidate"],
  [/^POST \/business\/me\/offers\/:\w+\/applications\/refuse$/, "refused candidates in bulk"],
  [/^POST \/profile\/applications\/:\w+\/rate$/, "rated a candidate"],
  [/\/unlock\//, "unlocked a contact"],
  [/^POST \/business\/me\/contacts\/:\w+$/, "unlocked a contact"],
  [/^POST \/business\/me\/applications\/:\w+\/:\w+\/notes$/, "wrote a note"],
  [/^PATCH \/business\/me\/applications\/:\w+\/:\w+\/notes\/:\w+$/, "edited a note"],
  [/^DELETE \/business\/me\/applications\/:\w+\/:\w+\/notes\/:\w+$/, "deleted a note"],
  [/^PUT \/business\/me\/applications\/:\w+\/:\w+\/opinion$/, "gave an opinion"],
  [/^DELETE \/business\/me\/applications\/:\w+\/:\w+\/opinion$/, "withdrew an opinion"],
  [/^POST \/business\/me\/interviews\/calendar\/reset$/, "reset the calendar link"],
  [/^POST \/business\/me\/interviews$/, "proposed an interview"],
  [/^PATCH \/business\/me\/interviews\/:\w+$/, "moved an interview"],
  [/^POST \/business\/me\/interviews\/:\w+\/cancel$/, "cancelled an interview"],
  [/^POST \/business\/me\/cv-screenings\/:\w+\/comparisons$/, "compared CVs"],
  [/^POST \/business\/me\/(cv-screenings|external-applications\/analyse)$/, "ran a CV analysis"],
  [/^DELETE \/business\/me\/cv-screenings\/:\w+$/, "deleted a CV analysis"],
  [/^PUT \/business\/me\/talents\/:\w+$/, "saved a profile"],
  [/^DELETE \/business\/me\/talents\/:\w+$/, "unsaved a profile"],
  [/^POST \/business\/me\/talents\/:\w+\/invite$/, "invited a profile to apply"],
  [/^POST \/business\/me\/mailboxes\/:\w+\/connect$/, "connected a mailbox"],
  [/^DELETE \/business\/me\/mailboxes\/:\w+$/, "disconnected a mailbox"],
  [/^POST \/business\/me\/team$/, "invited a team member"],
  [/^POST \/business\/me\/team\/:\w+\/resend$/, "resent an invitation"],
  [/^PATCH \/business\/me\/team\/:\w+$/, "changed a role"],
  [/^DELETE \/business\/me\/team\/:\w+$/, "removed a team member"],
  [/^\w+ \/business\/me\/careers-page/, "edited the careers page"],
  [/^POST \/business\/me\/documents$/, "uploaded a document"],
  [/^POST \/profile\/avatar$/, "changed the logo"],
  [/^PATCH \/business\/me$/, "edited the organisation"],
  [/^POST \/business\/me\/subscription/, "chose a plan"],
];

export function activityLabel(action: string): string {
  return RULES.find(([r]) => r.test(action))?.[1] ?? "made a change";
}

/** The offer a line is about, to link to it. */
export function activityOfferId(action: string, targetId: string | null): string | null {
  if (!targetId) return null;
  return /^\w+ \/(job-offers|profile\/job-offers|business\/me\/offers)\/:\w+/.test(action) ? targetId : null;
}
