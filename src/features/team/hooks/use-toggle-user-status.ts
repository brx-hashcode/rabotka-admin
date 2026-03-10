import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateAdminUser,
  deactivateAdminUser,
} from "#/lib/api/users-controller";

export function useToggleUserStatus(userId: string, isActive: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isActive ? deactivateAdminUser(userId) : activateAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
