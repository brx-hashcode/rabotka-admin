import { appConfig } from "#/config";

let token: string | null = null;

export function getCsrfToken(): string | null {
  return token;
}

export function setCsrfToken(value: string | null): void {
  token = value;
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
      return fetch(url, buildInit());
    }
    return new Response(JSON.stringify(body), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  return res;
}
