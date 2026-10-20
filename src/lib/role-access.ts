import type { AdminRole, LateralRole } from "./api/auth-controller";

export const LATERAL_ROLES = ["FINANCE", "SUPPORT"] as const;

export function isLateralRole(
  role: AdminRole | undefined,
): role is LateralRole {
  return role === "FINANCE" || role === "SUPPORT";
}

export type AreaAccess = "full" | "read";

/**
 * Which routes each lateral role may open, and whether they may act there.
 *
 * Mirrors LATERAL_ACCESS in the backend's `lateral-access.ts` — the server is
 * the authority, this copy only decides what to render so the UI never offers
 * a button that would come back 403. Keep the two in step.
 */
const LATERAL_ROUTES: Record<LateralRole, Record<string, AreaAccess>> = {
  // FINANCE is ADMIN with one thing taken away: team management. Every route
  // below is one an ADMIN also reaches. `/settings` is absent, but that is not
  // a second restriction — it is SUPER_ADMIN-only for everyone, ADMIN included,
  // which is why the sidebar gates it that way too.
  FINANCE: {
    // Every area is "full": finance acts, it does not only look. Several of
    // these expose no write action today (dashboard, network, logs), so it
    // makes no practical difference there — but stating the policy keeps this
    // in step with LATERAL_ACCESS on the server, which says the same.
    "/": "full",
    "/wallet": "full",
    "/payment-requests": "full",
    "/penalties": "full",
    "/profiles": "full",
    "/jobs": "full",
    "/applications": "full",
    "/job-categories": "full",
    "/claim": "full",
    "/chat": "full",
    "/events": "full",
    "/documents": "full",
    "/ads-bundles": "full",
    "/advertisements": "full",
    "/whatsapp": "full",
    "/network": "full",
    "/feedback": "full",
    "/logs": "full",
    // Rabotka pays agents, so finance needs the whole picture.
    "/agents": "full",
    // Paying agents' withdrawals is finance's job.
    "/agent-payouts": "full",
    // NOT PRESENT, deliberately: /team, /settings and /oauth-apps.
    //
    // /oauth-apps is SUPER_ADMIN-only for everyone, ADMIN included, so leaving
    // it out keeps FINANCE level with ADMIN rather than above it — the same
    // reasoning as /settings. It mirrors the backend's LATERAL_ACCESS, where
    // `admin/oauth-apps` is likewise absent.
  },
  // Support is not a narrow badge here — it is the team that runs the platform
  // day to day: they verify profiles, work claims, moderate listings and answer
  // for penalties. The previous map gave them `read` on most of that, so the
  // pages opened and every action on them 403'd.
  //
  // `full` is safe to hand out because RolesGuard still caps lateral roles at
  // MANAGER level: SUPER_ADMIN-only actions (bulk purge) and ADMIN-only ones
  // (crediting a wallet) stay out of reach without being listed here.
  SUPPORT: {
    "/": "read",
    "/claim": "full",
    "/chat": "full",
    "/profiles": "full",
    "/applications": "full",
    "/jobs": "full",
    "/penalties": "full",
    // "Did the customer actually get the message?" is the first question on
    // half of all support tickets.
    "/whatsapp": "read",
    // Post-unlock sentiment is context for the claim next to it. The server has
    // always granted this; only this file was out of step.
    "/feedback": "read",
    // Calling the people whose sign-up stopped halfway, and noting why.
    // Mirrors 'admin/onboarding-attempts' on the server.
    "/onboarding-dropoffs": "full",
    // "Is this caller really one of our agents?" — read only: creating and
    // suspending agents stays with MANAGER and above, as on the server.
    "/agents": "read",
  },
};

/** Reachable by anyone who can log in, whatever their role. */
const UNIVERSAL_ROUTES = ["/help"];

/** Where each lateral role lands. Both can open the dashboard now. */
const LATERAL_LANDING: Record<LateralRole, string> = {
  FINANCE: "/",
  SUPPORT: "/",
};

export function landingRouteFor(role: AdminRole | undefined): string {
  return isLateralRole(role) ? LATERAL_LANDING[role] : "/";
}

/**
 * The access a lateral role has at `pathname`, or null if the area is not
 * theirs. Longest prefix wins so `/profiles/:id` inherits `/profiles`.
 */
export function lateralAccessAt(
  role: LateralRole,
  pathname: string,
): AreaAccess | null {
  const routes = LATERAL_ROUTES[role];
  if (pathname === "/") return routes["/"] ?? null;

  let best: AreaAccess | null = null;
  let bestLength = 0;
  for (const [prefix, access] of Object.entries(routes)) {
    if (prefix === "/") continue;
    const isMatch = pathname === prefix || pathname.startsWith(`${prefix}/`);
    if (isMatch && prefix.length > bestLength) {
      best = access;
      bestLength = prefix.length;
    }
  }
  return best;
}

/** Whether the role may open this route at all. */
export function canViewRoute(
  role: AdminRole | undefined,
  pathname: string,
): boolean {
  if (!role) return false;
  if (UNIVERSAL_ROUTES.some((p) => pathname.startsWith(p))) return true;
  // Hierarchical roles keep today's behaviour: the sidebar hides links, but
  // routes themselves are not gated here.
  if (!isLateralRole(role)) return true;
  return lateralAccessAt(role, pathname) !== null;
}

/**
 * Whether the role may perform write actions in an area — what the bulk-action
 * buttons key off. Hierarchical roles fall back to the existing content rule.
 */
export function canEditArea(
  role: AdminRole | undefined,
  pathname: string,
): boolean {
  if (!role) return false;
  if (isLateralRole(role)) return lateralAccessAt(role, pathname) === "full";
  return role === "MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN";
}
