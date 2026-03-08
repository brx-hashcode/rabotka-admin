import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProfileById,
  updateProfile,
  verifyProfile,
  updateProfileStatus,
  type AdminProfileDetailResponse,
  type AdminUpdateProfileParams,
  type AdminVerifyProfileParams,
  type AdminUpdateStatusParams,
} from "#/lib/api/profiles-controller";

export function useProfileDetail(profileId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "profiles", profileId];

  const query = useQuery({
    queryKey,
    queryFn: () => getProfileById(profileId),
    enabled: !!profileId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: AdminUpdateProfileParams) =>
      updateProfile(profileId, data),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, data);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (data: AdminVerifyProfileParams) =>
      verifyProfile(profileId, data),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, data);
      toast.success("KYC verification submitted");
    },
    onError: () => {
      toast.error("Failed to submit KYC verification");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (data: AdminUpdateStatusParams) =>
      updateProfileStatus(profileId, data),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, data);
      toast.success("Status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    verifyProfile: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
    updateStatus: statusMutation.mutateAsync,
    isUpdatingStatus: statusMutation.isPending,
  };
}
