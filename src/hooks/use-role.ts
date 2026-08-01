import { useAdminMe } from "./use-admin-me";
import { canEditArea, isLateralRole } from "#/lib/role-access";

export function useRole() {
  const { data: admin } = useAdminMe();
  const role = admin?.role;

  return {
    role,
    /** True only for the seniority ladder — FINANCE/SUPPORT are not "content" roles. */
    canManageContent:
      role === "MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN",
    canManageTeam: role === "ADMIN" || role === "SUPER_ADMIN",
    canDeleteTeam: role === "SUPER_ADMIN",
    /** Permanent deletion cascades into financial records — SUPER_ADMIN only. */
    canPurge: role === "SUPER_ADMIN",
    isLateral: isLateralRole(role),
    /**
     * Write access for one area, e.g. `canEditArea("/penalties")`. Use this
     * instead of `canManageContent` on pages a lateral role can act in, or
     * FINANCE will see a read-only penalties table it is allowed to edit.
     */
    canEditArea: (pathname: string) => canEditArea(role, pathname),
  };
}
