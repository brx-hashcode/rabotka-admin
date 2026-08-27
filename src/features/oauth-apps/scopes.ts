/**
 * How each scope is described to an admin registering an application.
 *
 * The wording here is for the person granting the permission; the wording the
 * end user sees on the consent screen lives in rabotka-client's
 * `content/oauth/consent.ts`. Two audiences, two vocabularies — an admin needs
 * to know what a partner can build with a scope, a user needs to know what
 * leaves their account.
 *
 * The canonical list is the API's `SUPPORTED_SCOPES`, exposed at
 * `GET /admin/oauth-apps/scopes`. This is labelling only, and the page falls
 * back to the raw value for anything it does not recognise, so adding a scope
 * server-side never leaves this screen unable to render.
 */
export const SCOPE_LABELS = [
  {
    value: "openid",
    label: "openid",
    detail: "Required. The per-application subject identifier.",
  },
  {
    value: "profile",
    label: "Profile",
    detail: "First name, last name, avatar.",
  },
  {
    value: "phone",
    label: "Phone number",
    detail: "E.164 number, always with phone_number_verified: true.",
  },
  {
    value: "rabotka:verification",
    label: "Rabotka verification status",
    detail:
      "Whether KYC was approved by an admin, and when. The reason most partners integrate.",
  },
  {
    value: "email",
    label: "Email",
    detail: "Address only. Rabotka never verifies it, and says so in the claim.",
  },
  {
    value: "rabotka:location",
    label: "City and country",
    detail: "No street address.",
  },
] as const;

/**
 * What a new registration starts with.
 *
 * `email` and `rabotka:location` are off by default: they are personal data
 * with no bearing on "is this a real, verified person", which is the question
 * this product answers. A partner who needs them has to ask, and that
 * conversation is the point.
 */
export const DEFAULT_SCOPES = [
  "openid",
  "profile",
  "phone",
  "rabotka:verification",
] as const;

export function scopeLabel(value: string): string {
  return SCOPE_LABELS.find((s) => s.value === value)?.label ?? value;
}
