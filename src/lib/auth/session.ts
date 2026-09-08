import { appConfig } from "#/config";

/**
 * When a 401 means the session is dead — and when it emphatically does not.
 *
 * Before this module the admin console had exactly one auth gate: the `getMe`
 * call in `_authenticated.beforeLoad`. That query is cached with a 5 minute
 * `staleTime`, so `/me` is not re-hit on navigation — a session could die and
 * the console would keep rendering off cache while every other request 401'd,
 * showing error toasts to someone who had no idea they were logged out.
 *
 * This module holds the whole decision, and nothing else. It imports only
 * `#/config`: the teardown it performs is registered from `main.tsx` rather
 * than imported (see `registerSessionTeardown`), which keeps every predicate
 * here reachable from a plain node unit test with no DOM and no mocking.
 */

// ── Status ──────────────────────────────────────────────────────────────────

/**
 * The HTTP status carried by a thrown error, or null if it carries none.
 *
 * Duck-typed on `statusCode` alone, deliberately, on two counts:
 *
 *  1. `ApiError` is NOT exported from `mvc-front-sdk` — its `dist/index.d.ts`
 *     re-exports only `core/base-controller`, `services/index` and
 *     `types/interfaces`. `instanceof` is therefore impossible. Do not "fix"
 *     this by importing the class; it is not there.
 *  2. Our own errors — the hand-rolled `delete` in `base-controller.ts` — must
 *     satisfy this predicate without impersonating an SDK object.
 *
 * Nothing else in this codebase puts a `statusCode` on a thrown value, so a
 * numeric one is unambiguously an HTTP status.
 */
export function httpStatusOf(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const status = (error as { statusCode?: unknown }).statusCode;
  return typeof status === "number" ? status : null;
}

/**
 * True only for a real HTTP 401.
 *
 * Notably false for `statusCode: 0`, which is the SDK's shape for a network
 * failure (`new ApiError("Network error occurred", 0, ...)`). That distinction
 * is the difference between "offline for three seconds" and "logged out".
 *
 * Also false for 403: the backend's RolesGuard returns 403 when an
 * authenticated admin opens a page above their role. Logging them out for that
 * would be wrong.
 */
export function is401(error: unknown): boolean {
  return httpStatusOf(error) === 401;
}

// ── Paths ───────────────────────────────────────────────────────────────────

/** Never dereferenced — it exists so `new URL` can parse a bare path in node. */
const OPAQUE_BASE = "http://session.invalid";

/**
 * Reduce anything a caller might pass to a clean, prefix-free API path.
 *
 * Two call-site flavours have to collapse to the same string: controllers pass
 * `/auth/admin/verify-otp`, while raw fetches pass the full
 * `/api/v1/auth/admin/verify-otp`.
 *
 * Parsed rather than string-matched, because the allowlist below is a security
 * boundary: `/admin/profiles?search=/auth/admin/verify-otp` must not match, and
 * `new URL` also resolves `..` so `/auth/admin/verify-otp/../me` correctly
 * becomes `/auth/admin/me`.
 *
 * Never touches `globalThis.location` — that is what keeps it node-testable.
 * Unparseable input returns "", which matches no allowlist entry and therefore
 * fails toward logging out rather than toward staying signed in.
 */
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

/**
 * Admin auth endpoints where a 401 means "you typed the wrong code", not
 * "your session is gone".
 *
 * This list is the whole safety of the feature. Every entry is verified against
 * the backend, and the guard status is deliberately NOT the criterion — two of
 * these are guarded routes that still 401 on user error:
 *
 *   send-otp / resend-otp   public   no code to get wrong, but same family
 *   verify-otp             public   auth.service.ts:590 wrong/expired code
 *   totp/login             public   wrong code
 *   qr/init|consume|confirm public  invalid or expired QR session
 *   qr/poll/:id            public   invalid session (parameterised, see below)
 *   phone/pair/verify      public   auth.service.ts:1052 wrong pairing code
 *   totp/enable            GUARDED  auth.service.ts:1132 wrong 6-digit code
 *   totp/disable           GUARDED  auth.service.ts:1161 wrong 6-digit code
 *
 * NOT on this list, and adding them would break real logout:
 *
 *   /auth/admin/me                    401 = expiry, the original gate
 *   /auth/admin/logout                401 = expiry
 *   /auth/admin/totp/setup            GUARDED, no user-supplied code -> expiry
 *   /auth/admin/phone/pair            GUARDED -> expiry
 *   /auth/admin/phone/pair/generate   GUARDED -> expiry
 *
 * That last group is why matching is EXACT rather than by prefix: a
 * `/auth/admin/phone/pair*` wildcard would silently swallow two endpoints whose
 * 401 is a genuine expiry.
 *
 * ADDING AN ENDPOINT UNDER /auth/admin/ REQUIRES A DECISION HERE. If it can
 * 401 on user error and is not listed, admins get logged out for typos.
 *
 * Accepted trade-off: allowlisting totp/enable|disable means a genuine expiry
 * while the TOTP card is open will not log out. That is a false negative — the
 * next request anywhere else catches it. A false positive (booting someone for
 * a typo) is far worse. The real fix belongs in the backend: validation
 * failures should be BadRequestException, not UnauthorizedException. When that
 * lands, four entries drop off this list.
 */
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

/**
 * The one parameterised exception. `qr/poll/:sessionId` cannot be an exact
 * match; the bare `/auth/admin/qr/poll` is not a route and must not match.
 */
const AUTH_ESTABLISHMENT_PREFIXES: readonly string[] = [
  "/auth/admin/qr/poll/",
];

/** Exported for the test that guards against a reintroduced wildcard. */
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

/** The whole policy: a 401, from somewhere that is not a login attempt. */
export function isSessionExpiry(error: unknown, path: string): boolean {
  return is401(error) && !isAuthEstablishmentPath(path);
}

// ── Teardown ────────────────────────────────────────────────────────────────

type Teardown = () => void;

let teardown: Teardown | null = null;
let expiring = false;

/**
 * Register what to discard when a session ends. Called once from `main.tsx`,
 * beside `attachTopLoader` and `attachAssetReload`.
 *
 * Registration rather than import: this module would otherwise have to import
 * `getQueryClient` from `app/providers` (which pulls in the whole component
 * tree) and `setCsrfToken` from `api/csrf-token` (which would import back here
 * for `guardResponse` — a genuine cycle). Inverting it keeps this module
 * dependency-free and unit-testable.
 */
export function registerSessionTeardown(fn: Teardown): void {
  teardown = fn;
}

/** True once a session end is under way. Never resets — the page is going. */
export function isExpiring(): boolean {
  return expiring;
}

function runTeardown(): void {
  if (!teardown) {
    // The navigation still happens, so the failure mode is "cache survived a
    // logout", not "logout broken" — but it is worth saying out loud.
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

/**
 * End the session and send the user to the login page, once.
 *
 * Hard navigation, not a router navigate: a dead session must leave nothing
 * behind, and `location.assign` guarantees every cache, in-flight request,
 * timer and socket goes with the document. It also means this module needs no
 * router handle — the live router is module-local to `main.tsx`, and
 * `redirect()` from @tanstack/react-router only works inside a route lifecycle.
 *
 * Callers must rethrow afterwards. Swallowing the error to suppress the toast
 * would turn any case where navigation is blocked into a permanently hung UI.
 */
export function expireSession(reason: string): void {
  if (expiring) return;

  // Already on an auth screen. The login route's own beforeLoad calls getMe and
  // EXPECTS a 401 when signed out, so redirecting here would be a loop. Still
  // sets the flag, which quiets the React Query retry predicate.
  if (globalThis.location?.pathname?.startsWith("/auth/")) {
    expiring = true;
    return;
  }

  expiring = true;
  const here = currentLocation();

  runTeardown();
  // The only forensic trail left for a bug that by definition destroys the page.
  console.warn("[session] expired:", reason);

  const search = here ? `?redirect=${encodeURIComponent(here)}` : "";
  globalThis.location.assign(`/auth/login${search}`);
}

/**
 * Deliberate sign-out, from the user menu.
 *
 * Shares the teardown with `expireSession` so there is one definition of what
 * ending a session means. Unlike expiry this keeps the server call — the cookie
 * is still valid here, and revoking it is the entire point — and passes no
 * `redirect`, because the user chose to leave.
 */
export function signOut(): void {
  expiring = true;
  runTeardown();
  globalThis.location.assign("/auth/login");
}

// ── Raw fetch ───────────────────────────────────────────────────────────────

/**
 * Observe a `Response` from a raw fetch, firing session expiry on a 401.
 *
 * Returns the response untouched and never reads the body — every call site
 * consumes `.blob()` or `.text()` afterwards, and a body can only be read once.
 *
 * Exists because three paths bypass the controller entirely: the hand-rolled
 * `delete`, `fetchWithCsrfRetry`, and the raw media fetches. A 401 on any of
 * them would otherwise be invisible.
 */
export function guardResponse(url: string, res: Response): Response {
  if (res.status === 401 && !isAuthEstablishmentPath(url)) {
    expireSession(`401 ${normalizeApiPath(url)}`);
  }
  return res;
}
