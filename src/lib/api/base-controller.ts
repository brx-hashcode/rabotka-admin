import { BaseController } from "mvc-front-sdk";
import { appConfig } from "#/config";
import { fetchAndSetCsrfToken, getCsrfToken } from "./csrf-token";

type RequestBody = Record<string, unknown> | FormData;

// Detect CSRF / forbidden errors by status code or message
function isCsrfError(err: unknown): boolean {
  if (err instanceof Error) {
    // mvc-front-sdk throws Error with message from the response body
    // CSRF failures return 403 with "invalid csrf token" or similar
    const msg = err.message.toLowerCase();
    return (
      msg.includes("csrf") ||
      msg.includes("forbidden") ||
      msg.includes("invalid csrf")
    );
  }
  return false;
}

// Attempt a call; on CSRF/403, refresh the token once and retry
async function withCsrfRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isCsrfError(err)) {
      await fetchAndSetCsrfToken();
      return fn(); // retry once with fresh token
    }
    throw err;
  }
}

export class AdminBaseController extends BaseController {
  constructor() {
    super(appConfig.apiUrl);
  }

  protected mergeCsrfHeaders(headers?: HeadersInit): HeadersInit {
    const token = getCsrfToken();

    const csrfHeaders: Record<string, string> = token
      ? { "x-csrf-token": token }
      : {};

    if (!headers) {
      return csrfHeaders;
    }

    if (headers instanceof Headers) {
      const merged = new Headers(headers);
      if (token) {
        merged.set("x-csrf-token", token);
      }
      return merged;
    }

    if (Array.isArray(headers)) {
      const merged = [...headers];
      if (token) {
        merged.push(["x-csrf-token", token]);
      }
      return merged;
    }

    return { ...csrfHeaders, ...headers };
  }

  protected get<T>(path: string, headers?: HeadersInit): Promise<T> {
    return this.apiService.get<T>(path, this.mergeCsrfHeaders(headers));
  }

  protected post<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return withCsrfRetry(() =>
      this.apiService.post<T>(path, body, this.mergeCsrfHeaders(headers)),
    );
  }

  protected put<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return withCsrfRetry(() =>
      this.apiService.put<T>(path, body, this.mergeCsrfHeaders(headers)),
    );
  }

  protected patch<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return withCsrfRetry(() =>
      this.apiService.patch<T>(path, body, this.mergeCsrfHeaders(headers)),
    );
  }

  protected async delete<T>(path: string, headers?: HeadersInit): Promise<T> {
    return withCsrfRetry(async () => {
      const mergedHeaders = this.mergeCsrfHeaders(headers);
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const url = `${appConfig.apiUrl}${normalizedPath}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: mergedHeaders,
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          (body as Record<string, string>).message ??
          (body as Record<string, string>).error ??
          "Unknown error";
        throw new Error(msg);
      }
      if (res.status === 204 || res.headers.get("content-length") === "0") {
        return { success: true } as T;
      }
      return res.json() as Promise<T>;
    });
  }
}
