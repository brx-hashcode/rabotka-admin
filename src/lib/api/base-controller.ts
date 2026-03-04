import { BaseController } from "mvc-front-sdk";
import { appConfig } from "#/config";
import { getCsrfToken } from "./csrf-token";

type RequestBody = Record<string, unknown> | FormData;

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
    return this.apiService.post<T>(
      path,
      body,
      this.mergeCsrfHeaders(headers),
    );
  }

  protected put<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return this.apiService.put<T>(
      path,
      body,
      this.mergeCsrfHeaders(headers),
    );
  }

  protected patch<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return this.apiService.patch<T>(
      path,
      body,
      this.mergeCsrfHeaders(headers),
    );
  }

  protected delete<T>(path: string, headers?: HeadersInit): Promise<T> {
    return this.apiService.delete<T>(path, this.mergeCsrfHeaders(headers));
  }
}
