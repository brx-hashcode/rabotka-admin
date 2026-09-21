import { appConfig } from "#/config";

export function httpStatusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const status = (error as { statusCode?: unknown }).statusCode;
  return typeof status === "number" ? status : null;
}


export function is401(error: unknown): boolean {
  return httpStatusOf(error) === 401;
}


const OPAQUE_BASE = "http://session.invalid";

export function normalizeApiPath(input: string): string {
  let pathname: string;
  try {
    pathname = new URL(input, OPAQUE_BASE).pathname;
  } catch {
    return "";
  }

  const prefix = appConfig.apiUrl;
  if (pathname === prefix) return "";
  if (pathname.startsWith(`${prefix}/`)) {
    pathname = pathname.slice(prefix.length);
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  if (pathname === "/") return "";
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  return pathname;
}

const AUTH_ESTABLISHMENT_PATHS: ReadonlySet<string> = new Set([
  "/auth/admin/send-otp",
  "/auth/admin/resend-otp",
  "/auth/admin/verify-otp",
  "/auth/admin/totp/login",
  "/auth/admin/totp/enable",
  "/auth/admin/totp/disable",
  "/auth/admin/qr/init",
  "/auth/admin/qr/consume",
  "/auth/admin/qr/confirm",
  "/auth/admin/phone/pair/verify",
]);


const AUTH_ESTABLISHMENT_PREFIXES: readonly string[] = [
  "/auth/admin/qr/poll/",
];

export const authEstablishmentPathsForTest = {
  exact: AUTH_ESTABLISHMENT_PATHS,
  prefixes: AUTH_ESTABLISHMENT_PREFIXES,
};

export function isAuthEstablishmentPath(input: string): boolean {
  const path = normalizeApiPath(input);
  if (path === "") return false;
  if (AUTH_ESTABLISHMENT_PATHS.has(path)) return true;
  return AUTH_ESTABLISHMENT_PREFIXES.some(
    (prefix) => path.startsWith(prefix) && path.length > prefix.length,
  );
}

export function isSessionExpiry(error: unknown, path: string): boolean {
  return is401(error) && !isAuthEstablishmentPath(path);
}


type Teardown = () => void;

let teardown: Teardown | null = null;
let expiring = false;

export function registerSessionTeardown(fn: Teardown): void {
  teardown = fn;
}

export function isExpiring(): boolean {
  return expiring;
}

function runTeardown(): void {
  if (!teardown) {
    console.warn("[session] no teardown registered; client state kept");
    return;
  }
  try {
    teardown();
  } catch (error) {
    console.warn("[session] teardown failed", error);
  }
}

function currentLocation(): string {
  const { pathname, search, hash } = globalThis.location;
  return `${pathname}${search}${hash}`;
}

export function expireSession(reason: string): void {
  if (expiring) return;

  if (globalThis.location?.pathname?.startsWith("/auth/")) {
    expiring = true;
    return;
  }

  expiring = true;
  const here = currentLocation();

  runTeardown();
  console.warn("[session] expired:", reason);

  const search = here ? `?redirect=${encodeURIComponent(here)}` : "";
  globalThis.location.assign(`/auth/login${search}`);
}

export function signOut(): void {
  expiring = true;
  runTeardown();
  globalThis.location.assign("/auth/login");
}


export function guardResponse(url: string, res: Response): Response {
  if (res.status === 401 && !isAuthEstablishmentPath(url)) {
    expireSession(`401 ${normalizeApiPath(url)}`);
  }
  return res;
}
