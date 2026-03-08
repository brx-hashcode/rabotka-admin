import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getPenaltiesList } from "#/lib/api/penalties-controller";

const defaultLimit = 10;

const penaltiesParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultLimit),
  q: parseAsString.withDefault(""),
  payment_status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function usePenaltiesList() {
  const [queryState] = useQueryStates(penaltiesParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, payment_status } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, payment_status, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.payment_status?.length
      ? { payment_status: queryState.payment_status }
      : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "penalties", params],
    queryFn: () => getPenaltiesList(params),
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
