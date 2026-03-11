import { useQuery } from "@tanstack/react-query";
import {
  getPenaltyById,
  type AdminPenaltyDetailResponse,
} from "#/lib/api/penalties-controller";

export function usePenaltyDetail(penaltyId: string) {
  const query = useQuery<AdminPenaltyDetailResponse>({
    queryKey: ["admin", "penalties", penaltyId],
    queryFn: () => getPenaltyById(penaltyId),
    enabled: !!penaltyId,
  });

  return {
    penalty: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
