import { useRouterState } from "@tanstack/react-router";
import { useAdminMe } from "./use-admin-me";
import { canEditArea, isLateralRole } from "#/lib/role-access";

export function useRole() {
  const { data: admin } = useAdminMe();
  const role = admin?.role;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return {
    role,
    /**
     * Whether this admin may act on the page they are currently looking at.
     *
     * Ladder roles answer by seniority. Lateral roles answer by area, because
     * seniority is not what grants them anything — and answering `false` for
     * them (as this did) hid every action button on pages the server would have
     * accepted the action on. FINANCE saw a read-only penalties board it fully
     * owns; SUPPORT saw a claims board it could not comment on.
     *
     * Reading the route here rather than at each call site is deliberate: some
     * twenty components already ask this question, and they all mean "here".
     */
    canManageContent: isLateralRole(role)
      ? canEditArea(role, pathname)
      : role === "MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN",
    canManageTeam: role === "ADMIN" || role === "SUPER_ADMIN",
    canDeleteTeam: role === "SUPER_ADMIN",
    /**
     * Permanent deletion cascades into financial records. SUPER_ADMIN, plus
     * FINANCE in the areas it owns — it reaches everything an admin does except
     * team and settings, and the server enforces the same.
     */
    canPurge:
      role === "SUPER_ADMIN" ||
      (role === "FINANCE" && canEditArea(role, pathname)),
    isLateral: isLateralRole(role),
    /**
     * Write access for a named area, e.g. `canEditArea("/penalties")`. Prefer
     * `canManageContent` for the current page; this is for asking about another.
     */
    canEditArea: (path: string) => canEditArea(role, path),
  };
}
