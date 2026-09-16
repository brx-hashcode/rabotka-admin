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
  if (!value) return "Add the address where we should send the results";

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Enter a full web address, starting with https://";
  }

  if (url.username || url.password) return "The address can't contain a username or password";
  if (url.hash) return "The address can't contain a # sign";
  if (url.protocol === "https:") return null;

  if (url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname)) {
    return isSandbox
      ? null
      : "Addresses on this computer (localhost) only work for test apps";
  }
  return "The address must start with https://";
}
