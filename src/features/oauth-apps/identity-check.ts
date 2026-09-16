/**
 * The identity-check switch on a partner application.
 *
 * On the API it is a scope, `rabotka:identity_check`, in `allowedScopes` — but
 * it is not a login scope, so it is shown as its own switch rather than among
 * the consent-screen checkboxes. Turning it on requires a webhook URL; the API
 * enforces that too, this only says so before the round trip.
 */
export const IDENTITY_CHECK_SCOPE = "rabotka:identity_check";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function hasIdentityCheck(scopes: readonly string[]): boolean {
  return scopes.includes(IDENTITY_CHECK_SCOPE);
}

/** `scopes` with the switch applied, leaving every other scope untouched. */
export function withIdentityCheck(
  scopes: readonly string[],
  enabled: boolean,
): string[] {
  const rest = scopes.filter((scope) => scope !== IDENTITY_CHECK_SCOPE);
  return enabled ? [...rest, IDENTITY_CHECK_SCOPE] : rest;
}

/** Why a webhook URL would be refused, or null. Mirrors the API's rules. */
export function webhookUrlProblem(
  raw: string,
  isSandbox: boolean,
): string | null {
  const value = raw.trim();
  if (!value) return "A webhook URL is required to enable identity checks";

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Enter a full absolute URL";
  }

  if (url.username || url.password) return "No credentials in the URL";
  if (url.hash) return "No fragment (#) in the URL";
  if (url.protocol === "https:") return null;

  if (url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname)) {
    return isSandbox
      ? null
      : "http://localhost is only accepted for sandbox applications";
  }
  return "The URL must start with https://";
}
