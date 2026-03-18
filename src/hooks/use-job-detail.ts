import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getJobOfferById,
  updateJobOffer,
  updateJobOfferStatus,
  confirmJobPayment,
  deleteJobOffer,
  type AdminJobOfferDetailResponse,
  type AdminUpdateJobOfferParams,
} from "#/lib/api/jobs-controller";

export function useJobDetail(jobId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "job-offers", jobId];

  const query = useQuery<AdminJobOfferDetailResponse>({
    queryKey,
    queryFn: () => getJobOfferById(jobId),
    enabled: !!jobId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: AdminUpdateJobOfferParams) =>
      updateJobOffer(jobId, data),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminJobOfferDetailResponse>(queryKey, data);
      toast.success("Job offer updated successfully");
    },
    onError: () => {
      toast.error("Failed to update job offer");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteJobOffer(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "job-offers"] });
      toast.success("Job offer deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateJobOfferStatus(jobId, status),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminJobOfferDetailResponse>(queryKey, data);
      toast.success("Job offer status updated");
    },
    onError: () => {
      toast.error("Failed to update job offer status");
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: () => confirmJobPayment(jobId),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminJobOfferDetailResponse>(queryKey, data);
      toast.success("Payment confirmed — job offer is now active");
    },
    onError: () => {
      toast.error("Failed to confirm payment");
    },
  });

  return {
    job: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateJob: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    confirmPayment: confirmPaymentMutation.mutateAsync,
    isConfirmingPayment: confirmPaymentMutation.isPending,
    deleteJob: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
