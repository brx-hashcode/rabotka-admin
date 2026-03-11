import { useQuery } from "@tanstack/react-query";
import {
  getApplicationById,
  type AdminApplicationDetailResponse,
} from "#/lib/api/applications-controller";

export function useApplicationDetail(applicationId: string) {
  const query = useQuery<AdminApplicationDetailResponse>({
    queryKey: ["admin", "applications", applicationId],
    queryFn: () => getApplicationById(applicationId),
    enabled: !!applicationId,
  });

  return {
    application: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
