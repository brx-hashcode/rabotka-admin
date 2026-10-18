import { guardResponse } from "#/lib/auth/session";

/**
 * `fetch` for the calls that bypass the controllers — blob downloads and
 * multipart uploads. Sends the session cookie and turns a 401 into a logout,
 * which the controllers' own guard would otherwise never see. Callers get the
 * untouched Response and keep their own `!res.ok` handling.
 */
export async function guardedFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  return guardResponse(
    url,
    await fetch(url, { credentials: "include", ...init }),
  );
}
