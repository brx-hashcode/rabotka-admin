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
    label: "Sign-in",
    detail: "Always on. Lets the app recognise the same person each time.",
  },
  {
    value: "profile",
    label: "Name and photo",
    detail: "First name, last name and profile photo.",
  },
  {
    value: "phone",
    label: "Phone number",
    detail: "The WhatsApp number, which the person has just confirmed.",
  },
  {
    value: "rabotka:verification",
    label: "Identity check result (KYC)",
    detail:
      "Whether our team approved the person's ID, and when. This is why most partners connect.",
  },
  {
    value: "email",
    label: "Email",
    detail: "The address only. Rabotka doesn't confirm it, and tells the app so.",
  },
  {
    value: "rabotka:location",
    label: "City and country",
    detail: "Never the street address.",
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
  if (value === "rabotka:identity_check") return "Identity check";
  return SCOPE_LABELS.find((s) => s.value === value)?.label ?? value;
}
