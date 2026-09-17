import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getOAuthAppStats,
  listOAuthAppRequests,
  type PartnerApiCallKind,
} from "#/lib/api/oauth-apps-controller";

/** A partner app's figures. Fetched only while the drawer is open. */
export function useOAuthAppStats(appId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "oauth-apps", appId, "stats"],
    queryFn: () => getOAuthAppStats(appId),
    enabled: enabled && !!appId,
  });
}

/** One page of the partner's server calls, newest first. */
export function useOAuthAppRequests(
  appId: string,
  params: { page: number; limit: number; kind?: PartnerApiCallKind },
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["admin", "oauth-apps", appId, "requests", params],
    queryFn: () => listOAuthAppRequests(appId, params),
    enabled: enabled && !!appId,
    // Keeps the table filled while the next page loads.
    placeholderData: keepPreviousData,
  });
}
