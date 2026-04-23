import { useEffect, useRef } from "react";
import { parseAsString, parseAsInteger, useQueryState, useQueryStates } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { listAdvertisements } from "#/lib/api/advertisements-controller";
import { appConfig } from "#/config";

const advertisementsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  status: parseAsString.withDefault(""),
  bundleId: parseAsString.withDefault(""),
  targetAudience: parseAsString.withDefault(""),
  channel: parseAsString.withDefault(""),
};

export function useAdvertisementsList() {
  const [queryState] = useQueryStates(advertisementsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { status, bundleId, targetAudience, channel } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [status, bundleId, targetAudience, channel, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.status ? { status: queryState.status } : {}),
    ...(queryState.bundleId ? { bundleId: queryState.bundleId } : {}),
    ...(queryState.targetAudience ? { targetAudience: queryState.targetAudience } : {}),
    ...(queryState.channel ? { channel: queryState.channel } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "advertisements", params],
    queryFn: () => listAdvertisements(params),
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
