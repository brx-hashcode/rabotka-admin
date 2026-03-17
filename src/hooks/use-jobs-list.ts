import { useEffect, useRef } from "react";
import {
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { getJobOffersList } from "#/lib/api/jobs-controller";

const defaultLimit = 20;

const jobsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultLimit),
  q: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  payment_flow: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};

export function useJobsList() {
  const [queryState] = useQueryStates(jobsParsers);
  const [, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const isFirstMount = useRef(true);

  const { q, status, payment_flow } = queryState;

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(1);
  }, [q, status, payment_flow, setPage]);

  const params = {
    page: queryState.page,
    limit: queryState.limit,
    ...(queryState.q ? { q: queryState.q } : {}),
    ...(queryState.status?.length ? { status: queryState.status } : {}),
    ...(queryState.payment_flow?.length
      ? { payment_flow: queryState.payment_flow }
      : {}),
  };

  const query = useQuery({
    queryKey: ["admin", "jobs", params],
    queryFn: () => getJobOffersList(params),
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
