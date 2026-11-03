import { useQuery } from "@tanstack/react-query";
import { listBusinessPlans } from "#/lib/api/business-plans-controller";

export const BUSINESS_PLANS_KEY = ["admin", "business-plans"] as const;

export function useBusinessPlansList() {
  const query = useQuery({
    queryKey: BUSINESS_PLANS_KEY,
    queryFn: listBusinessPlans,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
