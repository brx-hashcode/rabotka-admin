import { useEffect, useRef } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";

import { appConfig } from "#/config";
import { getBroadcastsList } from "#/lib/api/broadcasts-controller";

export const broadcastsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(appConfig.defaultPaginationLimit),
  status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function useBroadcastsList() {
  const [queryState] = useQueryStates(broadcastsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { status } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [status, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.status?.length ? { status: queryState.status } : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "broadcasts", params],
    queryFn: () => getBroadcastsList(params),
    // A SENDING broadcast moves on its own: the counters are written by the
    // queue worker, not by anything this page did. Without a poll the table
    // shows a stale "0 sent" until someone reloads.
    refetchInterval: (q) =>
      (q.state.data?.data ?? []).some(
        (b) => b.status === "SENDING" || b.status === "SCHEDULED",
      )
        ? 10_000
        : false,
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    limit: query.data?.limit ?? appConfig.defaultPaginationLimit,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
