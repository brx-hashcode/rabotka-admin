import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateMe } from "#/lib/api/auth-controller";
import type { Admin } from "#/lib/api/auth-controller";
import { useAdminMe } from "./use-admin-me";

export function useAdminProfile() {
  const queryClient = useQueryClient();
  const query = useAdminMe();

  const updateMutation = useMutation({
    mutationFn: (name: string) => updateMe({ name }),
    onSuccess: (data) => {
      queryClient.setQueryData<Admin>(["admin", "me"], data);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  return {
    admin: query.data,
    isLoading: query.isLoading,
    updateAdmin: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
