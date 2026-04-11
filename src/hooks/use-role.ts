import { useAdminMe } from "./use-admin-me";

export function useRole() {
  const { data: admin } = useAdminMe();
  const role = admin?.role;

  return {
    role,
    canManageContent:
      role === "MANAGER" || role === "ADMIN" || role === "SUPER_ADMIN",
    canManageTeam: role === "ADMIN" || role === "SUPER_ADMIN",
    canDeleteTeam: role === "SUPER_ADMIN",
  };
}
