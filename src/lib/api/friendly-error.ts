import { httpStatusOf } from "#/lib/auth/session";

export const NETWORK_ERROR =
  "Can't reach Rabotka right now. Check your internet connection and try again.";
export const SERVER_ERROR =
  "Something went wrong on our side. Try again in a moment.";
export const SESSION_ERROR = "Your session has ended. Please sign in again.";
export const PERMISSION_ERROR = "You don't have permission to do this.";
export const RATE_LIMIT_ERROR =
  "Too many attempts. Wait a moment and try again.";

/**
 * Wording that means the message was written for developers, not for the
 * person reading the toast: database and validation internals, raw values,
 * stack traces, HTTP reason phrases.
 */
const TECHNICAL =
  /prisma|invocation|\bundefined\b|\bnull\b|\bNaN\b|[0-9a-f]{8}-[0-9a-f]{4}-|must be (a|an|one of|longer|shorter)\b|should not exist|should not be empty|\bproperty\b|ECONN|ETIMEDOUT|timed? ?out|exception|\bstack\b|Error:|\bat \S+ \(|[{}]|\[object|unknown error|internal server error|bad request|unauthorized|forbidden|not found|network error|failed to fetch|load failed|unexpected token|json/i;

/**
 * A message fit to show an operations person.
 *
 * The server's own message is kept when it reads like a sentence meant for a
 * person — "This category is already used by 3 jobs" is more useful than any
 * fallback. Anything technical, and every network or server failure, is
 * replaced: by a standard sentence for those failures, or by the caller's
 * `fallback`, which should say what could not be done ("Couldn't save the
 * job. Try again.").
 */
export function friendlyError(error: unknown, fallback: string): string {
  const status = httpStatusOf(error);
  const message = messageOf(error);

  if (status === 0 || (status === null && isNetworkMessage(message))) {
    return NETWORK_ERROR;
  }
  if (status !== null && status >= 500) return SERVER_ERROR;
  if (status === 401) return SESSION_ERROR;
  if (status === 429) return RATE_LIMIT_ERROR;

  if (message && !TECHNICAL.test(message) && message.length <= 200) {
    return message;
  }
  if (status === 403) return PERMISSION_ERROR;
  return fallback;
}

function messageOf(error: unknown): string | null {
  if (typeof error === "string") return error.trim() || null;
  if (typeof error !== "object" || error === null) return null;

  const body = (error as { body?: { message?: unknown } }).body;
  const candidates = [body?.message, (error as { message?: unknown }).message];

  for (const candidate of candidates) {
    // A list is class-validator output — field-by-field developer wording.
    if (Array.isArray(candidate)) return candidate.join(", ") || null;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function isNetworkMessage(message: string | null): boolean {
  return (
    message !== null &&
    /network error|failed to fetch|load failed|networkerror/i.test(message)
  );
}
