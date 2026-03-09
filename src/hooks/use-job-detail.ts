import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getJobOfferById,
  updateJobOffer,
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

  return {
    job: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateJob: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
