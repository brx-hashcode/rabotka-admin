import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProfileById,
  updateProfile,
  verifyProfile,
  updateProfileStatus,
  confirmPayment,
  getProfileLogs,
  type AdminProfileDetailResponse,
  type AdminUpdateProfileParams,
  type AdminVerifyProfileParams,
  type AdminUpdateStatusParams,
} from "#/lib/api/profiles-controller";

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

  const paymentsQueryKey = ["admin", "profiles", profileId, "payment-requests"];

  const invalidateLogs = () =>
    queryClient.invalidateQueries({ queryKey: logsQueryKey });

  const invalidatePayments = () =>
    queryClient.invalidateQueries({ queryKey: paymentsQueryKey });

  const updateMutation = useMutation({
    mutationFn: (data: AdminUpdateProfileParams) =>
      updateProfile(profileId, data),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, data);
      invalidateLogs();
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
      invalidateLogs();
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
      invalidateLogs();
      toast.success("Status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (data: { decision: "ACCEPTED" | "REJECTED"; reason?: string }) =>
      confirmPayment(profileId, data.decision, data.reason),
    onSuccess: (data, variables) => {
      queryClient.setQueryData<AdminProfileDetailResponse>(queryKey, data);
      invalidateLogs();
      invalidatePayments();
      if (variables.decision === "ACCEPTED") {
        toast.success("Payment confirmed. Profile is now active.");
      } else {
        toast.success("Payment rejected.");
      }
    },
    onError: () => {
      toast.error("Failed to process payment decision");
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
    confirmPayment: confirmPaymentMutation.mutateAsync,
    isConfirmingPayment: confirmPaymentMutation.isPending,
    logs: logsQuery.data ?? [],
    isLoadingLogs: logsQuery.isLoading,
  };
}
