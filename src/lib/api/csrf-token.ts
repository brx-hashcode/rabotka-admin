import { appConfig } from "#/config";
import { guardResponse } from "#/lib/auth/session";

let token: string | null = null;

export function getCsrfToken(): string | null {
  return token;
}

export function setCsrfToken(value: string | null): void {
  token = value;
}

export async function ensureCsrfToken(): Promise<void> {
  if (token !== null) return;
  await fetchAndSetCsrfToken();
}

export async function fetchAndSetCsrfToken(): Promise<void> {
  try {
    const base = appConfig.apiUrl.replace(/\/$/, "");
    const path = "/csrf".replace(/^\//, "");
    const url = `${base}/${path}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`CSRF fetch failed: ${res.status}`);
    const data = (await res.json()) as { csrfToken: string };
    token = data.csrfToken ?? null;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    token = null;
  }
}

export async function fetchWithCsrfRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const buildInit = (): RequestInit => ({
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      ...(token ? { "x-csrf-token": token } : {}),
    },
  });

  const res = await fetch(url, buildInit());

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const msg = ((body as Record<string, string>).message ?? "").toLowerCase();
    if (
      msg.includes("csrf") ||
      msg.includes("forbidden") ||
      msg.includes("invalid")
    ) {
      await fetchAndSetCsrfToken();
      return guardResponse(url, await fetch(url, buildInit()));
    }
    // Synthesized 403 — deliberately not guarded; a 403 is never a 401.
    return new Response(JSON.stringify(body), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  // Blob downloads and multipart uploads bypass the controller entirely, so a
  // 401 here would otherwise be invisible to the session interceptor. Callers
  // still see the untouched Response and their own `!res.ok` handling.
  //
  // fetchAndSetCsrfToken above is deliberately NOT guarded: GET /csrf is the
  // bootstrap, and expiring on it would be a chicken-and-egg loop.
  return guardResponse(url, res);
}
