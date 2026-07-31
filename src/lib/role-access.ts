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
  FINANCE: {
    "/": "full",
    "/wallet": "full",
    "/payment-requests": "full",
    "/penalties": "full",
    "/profiles": "read",
  },
  SUPPORT: {
    "/claim": "full",
    "/chat": "full",
    "/profiles": "read",
    "/applications": "read",
    "/jobs": "read",
  },
};

/** Reachable by anyone who can log in, whatever their role. */
const UNIVERSAL_ROUTES = ["/help"];

/** Where each lateral role lands, since not all of them can open the dashboard. */
const LATERAL_LANDING: Record<LateralRole, string> = {
  FINANCE: "/",
  SUPPORT: "/claim",
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
