import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getApplicationsList } from "#/lib/api/applications-controller";

const defaultLimit = 10;

const applicationsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultLimit),
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  penalty_applied: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function useApplicationsList() {
  const [queryState] = useQueryStates(applicationsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, status, penalty_applied } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, status, penalty_applied, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.status?.length ? { status: queryState.status } : {}),
    ...(queryState.penalty_applied?.length
      ? { penalty_applied: queryState.penalty_applied }
      : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "applications", params],
    queryFn: () => getApplicationsList(params),
  });

  return {
    data: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    limit: query.data?.limit ?? defaultLimit,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
