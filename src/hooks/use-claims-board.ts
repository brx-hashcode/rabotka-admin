import { useQuery } from "@tanstack/react-query";
import { listClaims } from "#/lib/api/claims-controller";
import type {
  AdminClaimItem,
  AdminClaimStatus,
} from "#/lib/api/claims-controller";

const ALL_STATUSES: AdminClaimStatus[] = [
  "CREATED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
];

export function useClaimsBoard() {
  const query = useQuery({
    queryKey: ["admin", "claims", "board"],
    queryFn: () => listClaims({ limit: 100 }),
  });

  const claimsByStatus: Record<AdminClaimStatus, AdminClaimItem[]> = {
    CREATED: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    REJECTED: [],
  };

  for (const claim of query.data?.data ?? []) {
    claimsByStatus[claim.status].push(claim);
  }

  return {
    claimsByStatus,
    allStatuses: ALL_STATUSES,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
