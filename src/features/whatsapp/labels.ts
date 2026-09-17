/**
 * Plain names for the values the WhatsApp log stores. Anything not listed is
 * shown as-is, so a new value appears rather than disappearing.
 */

const KIND: Record<string, string> = {
  template: "Approved message",
  text: "Normal reply",
  media: "Image",
  flow: "Form",
  interactive: "Message with a button",
  interactive_cta: "Message with a button",
  // What people send us.
  interactive_reply: "Button tap",
  image: "Image",
  video: "Video",
  audio: "Voice note",
  document: "Document",
  location: "Location",
  reaction: "Reaction",
  flow_reply: "Form answer",
  unsupported: "Other",
};

const SERVICE: Record<string, string> = {
  cloud: "WhatsApp (Meta)",
  twilio: "WhatsApp (Twilio)",
};

const CATEGORY: Record<string, string> = {
  UTILITY: "Service update",
  MARKETING: "Promotion",
  AUTHENTICATION: "Sign-in code",
  SERVICE: "Reply",
};

const ERROR: Record<string, string> = {
  OUTSIDE_MESSAGING_WINDOW:
    "The person hasn't written to us in the last 24 hours, so only an approved message can be sent.",
  INVALID_RECIPIENT: "This number can't receive WhatsApp messages.",
  RATE_LIMITED: "WhatsApp asked us to slow down. It will be sent again.",
  TEMPLATE_NOT_FOUND:
    "This approved message doesn't exist on WhatsApp (not approved yet, or renamed).",
  AUTH_FAILED:
    "WhatsApp refused our access. The WhatsApp access key needs to be renewed.",
  NOT_CONFIGURED: "WhatsApp isn't set up for this server.",
  SANDBOX_LIMIT_REACHED: "The test account's sending limit was reached.",
  SENDER_IS_RECIPIENT: "The message was addressed to our own number.",
  MEDIA_ERROR: "The image or file couldn't be sent.",
  TRANSPORT_ERROR: "We couldn't reach WhatsApp. It will be sent again.",
  UNKNOWN: "WhatsApp refused the message without saying why.",
};

/** Where a queued send currently is, in the order it moves. */
export const QUEUE_STATE_LABEL: Record<string, string> = {
  waiting: "Waiting",
  active: "Sending",
  delayed: "Scheduled",
  failed: "Failed",
  completed: "Sent",
};

const lookup = (map: Record<string, string>, value: string | null) =>
  value ? (map[value] ?? map[value.toUpperCase()] ?? value) : "—";

export const messageKindLabel = (kind: string | null) => lookup(KIND, kind);
export const whatsappServiceLabel = (provider: string | null) =>
  lookup(SERVICE, provider);
export const messageCategoryLabel = (category: string | null) =>
  lookup(CATEGORY, category);
export const sendErrorLabel = (code: string | null) => lookup(ERROR, code);

/** `kycRejected` → "Kyc rejected": readable enough for an approved message's name. */
export function templateLabel(key: string | null): string {
  if (!key) return "—";
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** A failed send's raw error text, reduced to a sentence when a code is in it. */
export function failedSendReason(raw: string | null): string {
  if (!raw) return "—";
  const code = Object.keys(ERROR).find((key) => raw.includes(key));
  return code ? ERROR[code] : "WhatsApp didn't accept it.";
}
