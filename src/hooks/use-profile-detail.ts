import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProfileById,
  updateProfile,
  verifyProfile,
  updateProfileStatus,
  getProfileLogs,
  updateProfileAvatar,
  pauseProfileBot,
  resumeProfileBot,
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
      toast.success("Identity check decision saved");
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

  /**
   * Take the conversation over, or hand it back.
   *
   * One mutation rather than two, because the UI has one control: the boolean
   * it is given is the state the admin is asking FOR, which keeps the caller
   * from having to know which endpoint means which.
   *
   * The result is written straight into the cache — the deadline it returns is
   * the authority, and refetching to learn something the server just told us
   * would only make the switch feel slow.
   */
  const botPauseMutation = useMutation<
    { botPausedUntil: string | null },
    Error,
    boolean
  >({
    mutationFn: (paused: boolean) =>
      paused ? pauseProfileBot(profileId) : resumeProfileBot(profileId),
    onSuccess: ({ botPausedUntil }) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, (prev) =>
        prev ? { ...prev, botPausedUntil } : prev,
      );
      invalidateLogs();
      toast.success(
        botPausedUntil
          ? "VoVa is off for this profile — you're answering"
          : "VoVa is back on for this profile",
      );
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't change VoVa for this profile."));
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
    setBotPaused: botPauseMutation.mutateAsync,
    isTogglingBotPause: botPauseMutation.isPending,
  };
}
