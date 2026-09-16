import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProfileById,
  updateProfile,
  verifyProfile,
  updateProfileStatus,
  getProfileLogs,
  updateProfileAvatar,
  type AdminProfileDetailResponse,
  type AdminUpdateProfileParams,
  type AdminVerifyProfileParams,
  type AdminUpdateStatusParams,
} from "#/lib/api/profiles-controller";
import { friendlyError } from "#/lib/api/friendly-error";

export function useProfileDetail(profileId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "profiles", profileId];
  const logsQueryKey = ["admin", "profiles", profileId, "logs"];

  const query = useQuery({
    queryKey,
    queryFn: () => getProfileById(profileId),
    enabled: !!profileId,
  });

  const logsQuery = useQuery({
    queryKey: logsQueryKey,
    queryFn: () => getProfileLogs(profileId),
    enabled: !!profileId,
  });

  const invalidateLogs = () =>
    queryClient.invalidateQueries({ queryKey: logsQueryKey });

  const updateMutation = useMutation({
    mutationFn: (data: AdminUpdateProfileParams) =>
      updateProfile(profileId, data),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, data);
      invalidateLogs();
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't update this profile. Try again."));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (data: AdminVerifyProfileParams) =>
      verifyProfile(profileId, data),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, data);
      invalidateLogs();
      toast.success("KYC verification submitted");
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't update this profile. Try again."));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (data: AdminUpdateStatusParams) =>
      updateProfileStatus(profileId, data),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, data);
      invalidateLogs();
      toast.success("Status updated successfully");
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't update this profile. Try again."));
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => updateProfileAvatar(profileId, file),
    onSuccess: ({ avatarUrl }) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, (prev) =>
        prev ? { ...prev, avatarUrl } : prev,
      );
      toast.success("Avatar updated");
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't update this profile. Try again."));
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
    logs: logsQuery.data ?? [],
    isLoadingLogs: logsQuery.isLoading,
    updateAvatar: avatarMutation.mutateAsync,
    isUploadingAvatar: avatarMutation.isPending,
  };
}
