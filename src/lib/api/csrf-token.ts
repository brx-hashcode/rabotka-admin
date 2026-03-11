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
