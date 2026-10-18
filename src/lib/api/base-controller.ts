import { BaseController } from "mvc-front-sdk";
import { appConfig } from "#/config";
import {
  expireSession,
  isSessionExpiry,
  normalizeApiPath,
} from "#/lib/auth/session";

type RequestBody = Record<string, unknown> | FormData;

/**
 * Turn a 401 from anywhere into a logout.
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

  protected get<T>(path: string, headers?: HeadersInit): Promise<T> {
    return guard401(path, () =>
      this.apiService.get<T>(path, headers),
    );
  }

  protected post<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return guard401(path, () =>
      this.apiService.post<T>(path, body, headers),
    );
  }

  protected put<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return guard401(path, () =>
      this.apiService.put<T>(path, body, headers),
    );
  }

  protected patch<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return guard401(path, () =>
      this.apiService.patch<T>(path, body, headers),
    );
  }

  protected async delete<T>(path: string, headers?: HeadersInit): Promise<T> {
    return guard401(path, async () => {
      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const url = `${appConfig.apiUrl}${normalizedPath}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers,
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
    });
  }
}
