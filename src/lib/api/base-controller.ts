import { BaseController } from "mvc-front-sdk";
import { appConfig } from "#/config";
import { fetchAndSetCsrfToken, getCsrfToken } from "./csrf-token";
import {
  expireSession,
  httpStatusOf,
  isSessionExpiry,
  normalizeApiPath,
} from "#/lib/auth/session";

type RequestBody = Record<string, unknown> | FormData;

// Detect CSRF / forbidden errors by status code and message
function isCsrfError(err: unknown): boolean {
  // Status first, matching the gate `fetchWithCsrfRetry` has always had.
  //
  // The message checks below are correct today — no backend message collides
  // with them — but they are the kind of correctness that holds by luck. The
  // wrong-OTP message is 'Code de vérification invalide ou expiré', which is one
  // loosened substring away from matching: `includes("invalid")` would catch
  // "invalide" and silently REPLAY a verify-otp mutation. Requiring 403 makes
  // that class of accident impossible rather than merely absent.
  if (httpStatusOf(err) !== 403) return false;

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

/**
 * Turn a 401 from anywhere into a logout.
 *
 * Wraps OUTSIDE `withCsrfRetry`, deliberately: the retry gets to exhaust its one
 * attempt first, so this sees only the final outcome. One decision, one
 * navigation — rather than tearing the session down and then firing a fresh
 * request into it.
 *
 * Always rethrows. Swallowing the error to hide the toast that flashes during
 * unload would turn any blocked navigation into a permanently hung UI.
 */
async function guard401<T>(path: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isSessionExpiry(err, path)) {
      expireSession(`401 ${normalizeApiPath(path)}`);
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
    // No withCsrfRetry here, deliberately — GETs carry no CSRF token to refresh.
    return guard401(path, () =>
      this.apiService.get<T>(path, this.mergeCsrfHeaders(headers)),
    );
  }

  protected post<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return guard401(path, () =>
      withCsrfRetry(() =>
        this.apiService.post<T>(path, body, this.mergeCsrfHeaders(headers)),
      ),
    );
  }

  protected put<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return guard401(path, () =>
      withCsrfRetry(() =>
        this.apiService.put<T>(path, body, this.mergeCsrfHeaders(headers)),
      ),
    );
  }

  protected patch<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return guard401(path, () =>
      withCsrfRetry(() =>
        this.apiService.patch<T>(path, body, this.mergeCsrfHeaders(headers)),
      ),
    );
  }

  protected async delete<T>(path: string, headers?: HeadersInit): Promise<T> {
    return guard401(path, () =>
      withCsrfRetry(async () => {
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
          // Carries the status, unlike the plain Error this used to throw.
          // Without it a 401 from a DELETE is invisible to guard401 — this
          // method bypasses apiService, so nothing else attaches one.
          //
          // Safe downstream: it is still an Error with the same message, and
          // BaseController.handleError only unwraps genuine ApiError instances
          // and rethrows everything else untouched.
          throw Object.assign(new Error(msg), {
            name: "ApiError",
            statusCode: res.status,
            body,
          });
        }
        if (res.status === 204 || res.headers.get("content-length") === "0") {
          return { success: true } as T;
        }
        return res.json() as Promise<T>;
      }),
    );
  }
}
