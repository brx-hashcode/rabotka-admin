import type { TableHeaderToolbarFilterOption } from "#/components/table";

export const userRoleOptions: readonly TableHeaderToolbarFilterOption[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "MODERATOR", label: "Moderator" },
  { value: "FINANCE", label: "Finance" },
  { value: "SUPPORT", label: "Support" },
];
