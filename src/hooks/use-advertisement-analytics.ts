import { useQuery } from "@tanstack/react-query";
import { getAdvertisementAnalytics } from "#/lib/api/advertisements-controller";

export function useAdvertisementAnalytics(
  advertisementId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["admin", "advertisements", "analytics", advertisementId],
    queryFn: () => getAdvertisementAnalytics(advertisementId),
    enabled: enabled && !!advertisementId,
  });
}
