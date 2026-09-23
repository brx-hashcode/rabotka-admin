import type { AdminRole } from "#/lib/api/auth-controller";
import { isLateralRole } from "#/lib/role-access";

/**
 * May this role read the MESSAGES, as opposed to the conversation around them?
 *
 * Two tiers, because "who talks to whom" and "what they said" are different
 * acts. The list, the counters and the participants are MODERATOR. The bodies
 * are MANAGER and every read is written to the activity log.
 *
 * Lateral roles are excluded BY AREA, not by seniority. `RolesGuard` caps
 * SUPPORT at MANAGER, so a seniority comparison would quietly let them through;
 * the server says the same thing by leaving the thread controller out of
 * `LATERAL_ACCESS` rather than by ranking anybody.
 *
 * A module-local rule rather than another flag on `useRole()`: it is the only
 * place in the app where MANAGER means something the ladder does not already
 * say, and burying it in the shared hook would hide that.
 */
export function canReadConversationBody(role: AdminRole | undefined): boolean {
  if (!role || isLateralRole(role)) return false;
  return role === "MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN";
}
